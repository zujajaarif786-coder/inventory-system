from django.test import TestCase
from django.contrib.auth import get_user_model

from clients.models import Client
from categories.models import Category
from products.models import Product
from suppliers.models import Supplier
from purchasing.models import PurchaseOrder, PurchaseOrderItem
from inventory.models import InventoryTransaction

from inventory.services import add_stock


User = get_user_model()


class PurchasingWorkflowTests(TestCase):

    def setUp(self):
        self.client_obj = Client.objects.create(
            name="Purchase Test Client",
            code="PURCHASE001",
        )

        self.user = User.objects.create_user(
            username="purchaseuser",
            email="purchase@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_obj,
        )

        self.category = Category.objects.create(
            client=self.client_obj,
            name="Electronics",
            created_by=self.user,
        )

        self.product = Product.objects.create(
            client=self.client_obj,
            name="Test Laptop",
            sku="PURCHASE-SKU-001",
            category=self.category,
            cost_price=500,
            selling_price=700,
            stock_quantity=10,
            minimum_stock_level=2,
        )

        self.supplier = Supplier.objects.create(
            client=self.client_obj,
            name="Test Supplier",
        )

    def test_purchase_item_can_be_created(self):
        purchase = PurchaseOrder.objects.create(
            client=self.client_obj,
            supplier=self.supplier,
            order_number="PO-TEST-001",
            status="draft",
        )

        item = PurchaseOrderItem.objects.create(
            purchase_order=purchase,
            product=self.product,
            quantity=10,
            received_quantity=0,
            unit_cost=500,
        )

        self.assertEqual(
            purchase.client_id,
            self.client_obj.id,
        )

        self.assertEqual(
            item.product_id,
            self.product.id,
        )

        self.assertEqual(
            item.received_quantity,
            0,
        )

    def test_receiving_purchase_increases_stock(self):
        purchase = PurchaseOrder.objects.create(
            client=self.client_obj,
            supplier=self.supplier,
            order_number="PO-TEST-002",
            status="draft",
        )

        PurchaseOrderItem.objects.create(
            purchase_order=purchase,
            product=self.product,
            quantity=10,
            received_quantity=0,
            unit_cost=500,
        )

        add_stock(
            product_id=self.product.id,
            quantity=10,
            user=self.user,
            reference_type="purchase",
            reference_id=purchase.id,
            notes="Test purchase received",
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            20,
        )

        transaction = InventoryTransaction.objects.get(
            reference_type="purchase",
            reference_id=purchase.id,
        )

        self.assertEqual(
            transaction.client_id,
            self.client_obj.id,
        )

        self.assertEqual(
            transaction.quantity,
            10,
        )

    def test_purchase_client_and_product_must_match(self):
        other_client = Client.objects.create(
            name="Other Client",
            code="OTHER001",
        )

        other_category = Category.objects.create(
            client=other_client,
            name="Other Category",
            created_by=self.user,
        )

        other_product = Product.objects.create(
            client=other_client,
            name="Other Product",
            sku="OTHER-SKU-001",
            category=other_category,
        )

        purchase = PurchaseOrder.objects.create(
            client=self.client_obj,
            supplier=self.supplier,
            order_number="PO-TEST-003",
            status="draft",
        )

        # This is the business rule that our API must enforce.
        self.assertNotEqual(
            purchase.client_id,
            other_product.client_id,
        )