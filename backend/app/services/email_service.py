import httpx
import resend
import logging
from typing import Optional, Dict, Any

from app.core.config import settings

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

    def substitute_variables(self, text: str, variables: Dict[str, Any]) -> str:
        """
        Replace template variables like {{order_number}} with actual values.

        Args:
            text: Text containing {{variable}} placeholders
            variables: Dict of variable names to values

        Returns:
            Text with variables substituted
        """
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
        heading = self.substitute_variables(template.get("heading", ""), variables)
        body_html = self.render_portable_text(template.get("body", []))
        body_html = self.substitute_variables(body_html, variables)
        footer = self.substitute_variables(template.get("footerText", ""), variables)
        cta_text = template.get("ctaText")
        cta_url = self.substitute_variables(template.get("ctaUrl", ""), variables) if template.get("ctaUrl") else None

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
        variables: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send an email using a Sanity template.

        Args:
            to: Recipient email address
            template_id: Sanity email template ID (e.g., 'order-confirmation')
            variables: Variables to substitute in template (e.g., {'order_number': 'PRL-A3X9'})

        Returns:
            True if email was sent successfully, False otherwise
        """
        if not settings.RESEND_API_KEY:
            logger.warning(f"Skipping email to {to} - RESEND_API_KEY not configured")
            return False

        variables = variables or {}

        template = await self.fetch_email_template(template_id)
        if not template:
            logger.error(f"Email template '{template_id}' not found in Sanity")
            return False

        subject = self.substitute_variables(template.get("subject", ""), variables)
        html = self.build_email_html(template, variables)

        try:
            response = resend.Emails.send({
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            })
            logger.info(f"Email sent successfully to {to} (template: {template_id})")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False


# Singleton instance
email_service = EmailService()
