from typing import List, Dict, Any, Optional, Tuple
from app.schemas.checkout import CheckoutOrderLineCreate
from app.services.sanity_service import SanityService
import logging

logger = logging.getLogger(__name__)


class CartValidationError(Exception):
    """Custom exception for cart validation errors"""
    pass


class CartValidator:
    """Service for validating cart structure and product relationships"""

    def __init__(self, sanity_service: SanityService):
        self.sanity = sanity_service

    async def validate_checkout_order_lines(
        self,
        order_lines: List[CheckoutOrderLineCreate]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate order lines including parent-child relationships.

        Args:
            order_lines: List of order lines to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Collect all product IDs (including children)
        all_product_ids = []
        self._collect_product_ids(order_lines, all_product_ids)

        # Fetch all products from Sanity
        try:
            products = await self.sanity.get_products_by_ids(all_product_ids)
        except Exception as e:
            logger.error(f"Failed to fetch products from Sanity: {str(e)}")
            return False, "Kunne ikke validere produkter"

        # Create lookup dict
        products_dict = {p['_id']: p for p in products}

        # Validate each line
        for line in order_lines:
            is_valid, error = await self._validate_line(line, products_dict, parent_product=None)
            if not is_valid:
                return False, error

        return True, None

    def _collect_product_ids(self, lines: List[CheckoutOrderLineCreate], collector: List[str]):
        """Recursively collect all product IDs from order lines"""
        for line in lines:
            collector.append(line.product_id)
            if line.children:
                self._collect_product_ids(line.children, collector)

    async def _validate_line(
        self,
        line: CheckoutOrderLineCreate,
        products_dict: Dict[str, Any],
        parent_product: Optional[Dict[str, Any]]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate a single order line.

        Args:
            line: Order line to validate
            products_dict: Dict of product_id -> product data
            parent_product: Parent product data (None if top-level)

        Returns:
            Tuple of (is_valid, error_message)
        """
        product = products_dict.get(line.product_id)

        if not product:
            return False, f"Produkt ikke funnet: {line.product_id}"

        # Check if product is active
        if product.get('status') == 'out_of_stock':
            return False, f"Produktet '{product.get('title')}' er utsolgt"

        # Validate strukturprodukt rules
        requires_parent = product.get('requiresParent', False)
        product_type = product.get('productType')

        # Check if strukturprodukt has parent
        if requires_parent and parent_product is None:
            return False, f"Produktet '{product.get('title')}' kan ikke kjøpes alene"

        # Check if parent type is allowed
        if requires_parent and parent_product:
            allowed_parents = product.get('allowedParents', [])
            parent_type = parent_product.get('productType')
            if allowed_parents and parent_type not in allowed_parents:
                return False, f"Produktet '{product.get('title')}' kan ikke knyttes til denne produkttypen"

        # Validate quantity
        if line.quantity < 0:
            return False, f"Ugyldig antall for '{product.get('title')}': må være 0 eller mer"

        # Validate strukturprodukt quantity against parent's requiredBoards
        if requires_parent and parent_product:
            required_boards = parent_product.get('requiredBoards')
            if required_boards and required_boards > 0:
                max_allowed = required_boards * 2
                if line.quantity > max_allowed:
                    return False, f"For mange perlebrett: maksimalt {max_allowed} stk for dette kittet"

        # Recursively validate children
        if line.children:
            for child in line.children:
                is_valid, error = await self._validate_line(child, products_dict, parent_product=product)
                if not is_valid:
                    return False, error

        return True, None
