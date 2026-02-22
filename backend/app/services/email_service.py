import httpx
import resend
import logging
import re
from typing import Optional, Dict, Any, Set

from app.core.config import settings
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending transactional emails via Resend with Sanity templates"""

    def __init__(self):
        self.project_id = settings.SANITY_PROJECT_ID
        self.dataset = settings.SANITY_DATASET
        self.api_version = settings.SANITY_API_VERSION

        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
        else:
            logger.warning("RESEND_API_KEY not configured - emails will not be sent")

    def _get_sanity_query_url(self) -> str:
        """Get the Sanity GROQ query URL"""
        return f"https://{self.project_id}.api.sanity.io/v{self.api_version}/data/query/{self.dataset}"

    async def fetch_email_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch an email template from Sanity by templateId.

        Args:
            template_id: The templateId field in Sanity (e.g., 'order-confirmation')

        Returns:
            Email template dict or None if not found
        """
        url = self._get_sanity_query_url()
        query = f'*[_type == "emailTemplate" && templateId == "{template_id}"][0]{{_id,templateId,subject,heading,body,ctaText,ctaUrl,footerText}}'

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(url, params={"query": query})
                response.raise_for_status()
                result = response.json()
                return result.get("result")
            except Exception as e:
                logger.error(f"Failed to fetch email template '{template_id}': {e}")
                return None

    def render_portable_text(self, blocks: list) -> str:
        """
        Render Sanity Portable Text blocks to HTML.

        Args:
            blocks: Array of Portable Text blocks

        Returns:
            HTML string
        """
        if not blocks:
            return ""

        html_parts = []
        for block in blocks:
            if not isinstance(block, dict):
                continue

            block_type = block.get("_type", "block")

            if block_type == "block":
                style = block.get("style", "normal")
                children = block.get("children", [])

                text_parts = []
                for child in children:
                    text = child.get("text", "")
                    marks = child.get("marks", [])

                    # Apply marks (bold, italic, etc.)
                    for mark in marks:
                        if mark == "strong":
                            text = f"<strong>{text}</strong>"
                        elif mark == "em":
                            text = f"<em>{text}</em>"

                    text_parts.append(text)

                content = "".join(text_parts)

                # Map styles to HTML tags
                if style == "h1":
                    html_parts.append(f"<h1>{content}</h1>")
                elif style == "h2":
                    html_parts.append(f"<h2>{content}</h2>")
                elif style == "h3":
                    html_parts.append(f"<h3>{content}</h3>")
                elif style == "blockquote":
                    html_parts.append(f"<blockquote>{content}</blockquote>")
                else:
                    html_parts.append(f"<p>{content}</p>")

        return "\n".join(html_parts)

    def extract_template_variables(self, text: str) -> Set[str]:
        """
        Extract all template variables from text.

        Args:
            text: Text containing {{variable}} placeholders

        Returns:
            Set of variable names found in text
        """
        if not text:
            return set()
        # Match {{variable_name}} patterns
        pattern = r'\{\{(\w+)\}\}'
        return set(re.findall(pattern, text))

    def validate_variables(self, template: Dict[str, Any], variables: Dict[str, Any]) -> None:
        """
        Validate that all required template variables are provided.

        Args:
            template: Email template from Sanity
            variables: Variables provided for substitution

        Raises:
            ValueError: If any required variables are missing
        """
        all_variables = set()

        # Extract variables from subject
        if template.get("subject"):
            all_variables.update(self.extract_template_variables(template["subject"]))

        # Extract variables from heading
        if template.get("heading"):
            all_variables.update(self.extract_template_variables(template["heading"]))

        # Extract variables from body (Portable Text)
        if template.get("body"):
            body_html = self.render_portable_text(template["body"])
            all_variables.update(self.extract_template_variables(body_html))

        # Extract variables from footer
        if template.get("footerText"):
            all_variables.update(self.extract_template_variables(template["footerText"]))

        # Extract variables from CTA URL
        if template.get("ctaUrl"):
            all_variables.update(self.extract_template_variables(template["ctaUrl"]))

        # Check for missing variables
        missing = all_variables - set(variables.keys())
        if missing:
            raise ValueError(
                f"Missing required template variables: {', '.join(sorted(missing))}. "
                f"Template requires: {', '.join(sorted(all_variables))}"
            )

    def substitute_variables(self, text: str, variables: Dict[str, Any]) -> str:
        """
        Replace template variables like {{order_number}} with actual values.

        Args:
            text: Text containing {{variable}} placeholders
            variables: Dict of variable names to values

        Returns:
            Text with variables substituted
        """
        if text is None:
            return ""
        result = text
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    def build_email_html(
        self,
        template: Dict[str, Any],
        variables: Dict[str, Any]
    ) -> str:
        """
        Build complete HTML email from Sanity template.

        Args:
            template: Email template from Sanity
            variables: Variables to substitute in template

        Returns:
            Complete HTML email string
        """
        heading = self.substitute_variables(template.get("heading") or "", variables)
        body_html = self.render_portable_text(template.get("body") or [])
        body_html = self.substitute_variables(body_html, variables)
        footer = self.substitute_variables(template.get("footerText") or "", variables)
        cta_text = template.get("ctaText")
        cta_url = self.substitute_variables(template.get("ctaUrl") or "", variables) if template.get("ctaUrl") else None

        cta_html = ""
        if cta_text and cta_url:
            cta_html = f'''
            <div style="text-align: center; margin: 32px 0;">
                <a href="{cta_url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    {cta_text}
                </a>
            </div>
            '''

        footer_html = f'<p style="color: #666; font-size: 14px; margin-top: 32px;">{footer}</p>' if footer else ""

        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; margin-bottom: 24px;">{heading}</h1>
            {body_html}
            {cta_html}
            {footer_html}
        </body>
        </html>
        '''

    async def send_email(
        self,
        to: str,
        template_id: str,
        variables: Optional[Dict[str, Any]] = None,
        order_id: Optional[int] = None
    ) -> bool:
        """
        Send an email using a Sanity template.

        Args:
            to: Recipient email address
            template_id: Sanity email template ID (e.g., 'order-confirmation')
            variables: Variables to substitute in template (e.g., {'order_number': 'PRL-A3X9'})
            order_id: Optional order ID to log email sending to order history

        Returns:
            True if email was sent successfully, False otherwise
        """
        print(f"=== EMAIL SERVICE: Checking RESEND_API_KEY... ===")
        if not settings.RESEND_API_KEY:
            print(f"=== EMAIL SERVICE ERROR: RESEND_API_KEY not configured ===")
            logger.warning(f"Skipping email to {to} - RESEND_API_KEY not configured")
            return False

        variables = variables or {}

        print(f"=== EMAIL SERVICE: Fetching template '{template_id}' from Sanity... ===")
        template = await self.fetch_email_template(template_id)
        if not template:
            print(f"=== EMAIL SERVICE ERROR: Template '{template_id}' not found in Sanity ===")
            logger.error(f"Email template '{template_id}' not found in Sanity")
            return False
        print(f"=== EMAIL SERVICE: Template found: {template.get('subject')} ===")

        # Validate all required variables are provided
        try:
            self.validate_variables(template, variables)
        except ValueError as e:
            print(f"=== EMAIL SERVICE ERROR: {str(e)} ===")
            logger.error(f"Template variable validation failed for '{template_id}': {e}")
            raise

        subject = self.substitute_variables(template.get("subject") or "", variables)
        html = self.build_email_html(template, variables)

        print(f"=== EMAIL SERVICE: Sending via Resend from {settings.RESEND_FROM_EMAIL} to {to} ===")
        print(f"=== EMAIL SERVICE: Subject: {subject} ===")

        try:
            response = resend.Emails.send({
                "from": f"Feel Pearly <{settings.RESEND_FROM_EMAIL}>",
                "to": [to],
                "subject": subject,
                "html": html,
            })
            print(f"=== EMAIL SERVICE: Resend response: {response} ===")
            logger.info(f"Email sent successfully to {to} (template: {template_id})")

            # Log to order history if order_id provided
            if order_id:
                try:
                    from app.models.order_log import OrderLog
                    db = SessionLocal()
                    try:
                        log_entry = OrderLog(
                            order_id=order_id,
                            created_by_type="system",
                            message=f"Epost {subject} sendt til {to}"
                        )
                        db.add(log_entry)
                        db.commit()
                        logger.info(f"Logged email send to order {order_id}")
                    finally:
                        db.close()
                except Exception as log_error:
                    logger.error(f"Failed to log email send to order {order_id}: {log_error}")

            return True
        except Exception as e:
            print(f"=== EMAIL SERVICE ERROR: Failed to send via Resend: {type(e).__name__}: {str(e)} ===")
            logger.error(f"Failed to send email to {to}: {e}")

            # Log failure to order history if order_id provided
            if order_id:
                try:
                    from app.models.order_log import OrderLog
                    db = SessionLocal()
                    try:
                        log_entry = OrderLog(
                            order_id=order_id,
                            created_by_type="system",
                            message=f"Feil ved sending av epost til {to}: {str(e)}"
                        )
                        db.add(log_entry)
                        db.commit()
                    finally:
                        db.close()
                except Exception as log_error:
                    logger.error(f"Failed to log email error to order {order_id}: {log_error}")

            return False


# Singleton instance
email_service = EmailService()
