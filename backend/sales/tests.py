from django.test import TestCase
from django.contrib.auth import get_user_model

from clients.models import Client
from categories.models import Category
from products.models import Product
from customers.models import Customer
from sales.models import Sale, SaleItem
from inventory.models import InventoryTransaction

from django.core.exceptions import ValidationError

from sales.services import complete_sale


User = get_user_model()


class SalesWorkflowTests(TestCase):

    def setUp(self):
        self.client_obj = Client.objects.create(
            name="Sales Test Client",
            code="SALES001",
        )

        self.user = User.objects.create_user(
            username="salesuser",
            email="sales@example.com",
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
            name="Sales Laptop",
            sku="SALES-SKU-001",
            category=self.category,
            cost_price=500,
            selling_price=700,
            stock_quantity=10,
            minimum_stock_level=2,
        )

        self.customer = Customer.objects.create(
            client=self.client_obj,
            name="Test Customer",
        )

    def create_sale(self, quantity=2):
        sale = Sale.objects.create(
            client=self.client_obj,
            customer=self.customer,
            invoice_number="INV-TEST-001",
            status="draft",
        )

        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=quantity,
            unit_price=700,
        )

        return sale

    def test_sale_can_be_completed(self):
        sale = self.create_sale(quantity=2)

        complete_sale(
            sale=sale,
            user=self.user,
        )

        self.product.refresh_from_db()
        sale.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            8,
        )

        self.assertEqual(
            sale.status,
            "completed",
        )

    def test_sale_creates_inventory_transaction(self):
        sale = self.create_sale(quantity=3)

        complete_sale(
            sale=sale,
            user=self.user,
        )

        transaction = InventoryTransaction.objects.get(
            reference_type="sale",
            reference_id=sale.id,
        )

        self.assertEqual(
            transaction.client_id,
            self.client_obj.id,
        )

        self.assertEqual(
            transaction.quantity,
            -3,
        )

        self.assertEqual(
            transaction.stock_before,
            10,
        )

        self.assertEqual(
            transaction.stock_after,
            7,
        )

    def test_sale_cannot_exceed_stock(self):
        sale = self.create_sale(quantity=50)

        with self.assertRaises(ValidationError):
            complete_sale(
                sale=sale,
                user=self.user,
            )

        self.product.refresh_from_db()
        sale.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            10,
        )

        self.assertEqual(
            sale.status,
            "draft",
        )

    def test_completed_sale_cannot_be_completed_again(self):
        sale = self.create_sale(quantity=2)

        complete_sale(
            sale=sale,
            user=self.user,
        )

        with self.assertRaises(ValidationError):
            complete_sale(
                sale=sale,
                user=self.user,
            )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            8,
        )

    def test_cancelled_sale_cannot_be_completed(self):
        sale = self.create_sale(quantity=2)

        sale.status = "cancelled"
        sale.save(update_fields=["status"])

        with self.assertRaises(ValidationError):
            complete_sale(
                sale=sale,
                user=self.user,
            )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock_quantity,
            10,
        )

    def test_sale_cannot_use_other_client_product(self):
        other_client = Client.objects.create(
            name="Other Sales Client",
            code="SALES002",
        )

        other_category = Category.objects.create(
            client=other_client,
            name="Other Category",
            created_by=self.user,
        )

        other_product = Product.objects.create(
            client=other_client,
            name="Other Laptop",
            sku="OTHER-SALES-001",
            category=other_category,
            stock_quantity=20,
        )

        sale = Sale.objects.create(
            client=self.client_obj,
            customer=self.customer,
            invoice_number="INV-TEST-002",
            status="draft",
        )

        SaleItem.objects.create(
            sale=sale,
            product=other_product,
            quantity=2,
            unit_price=700,
        )

        with self.assertRaises(ValidationError):
            complete_sale(
                sale=sale,
                user=self.user,
            )

        other_product.refresh_from_db()

        self.assertEqual(
            other_product.stock_quantity,
            20,
        )