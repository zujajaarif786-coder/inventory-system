from django.test import TestCase
from django.contrib.auth import get_user_model

from clients.models import Client
from categories.models import Category
from products.models import Product
from inventory.models import InventoryTransaction
from inventory.services import add_stock, remove_stock, adjust_stock


User = get_user_model()


class InventoryServiceTests(TestCase):

    def setUp(self):
        self.client_obj = Client.objects.create(
            name="Test Client",
            code="TEST001",
        )

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_obj,
        )

        self.category = Category.objects.create(
            client=self.client_obj,
            name="Test Category",
            created_by=self.user,
        )

        self.product = Product.objects.create(
            client=self.client_obj,
            name="Test Product",
            sku="TEST-SKU-001",
            category=self.category,
            cost_price=100,
            selling_price=150,
            stock_quantity=10,
            minimum_stock_level=2,
        )

    def test_add_stock(self):
        transaction = add_stock(
            product_id=self.product.id,
            quantity=5,
            user=self.user,
            reference_type="test",
            notes="Test stock in",
        )

        self.product.refresh_from_db()

        self.assertEqual(self.product.stock_quantity, 15)
        self.assertEqual(transaction.quantity, 5)
        self.assertEqual(transaction.stock_before, 10)
        self.assertEqual(transaction.stock_after, 15)
        self.assertEqual(transaction.client_id, self.client_obj.id)

    def test_remove_stock(self):
        transaction = remove_stock(
            product_id=self.product.id,
            quantity=4,
            user=self.user,
            reference_type="test",
            notes="Test stock out",
        )

        self.product.refresh_from_db()

        self.assertEqual(self.product.stock_quantity, 6)
        self.assertEqual(transaction.quantity, -4)
        self.assertEqual(transaction.stock_before, 10)
        self.assertEqual(transaction.stock_after, 6)
        self.assertEqual(transaction.client_id, self.client_obj.id)

    def test_adjust_stock(self):
        transaction = adjust_stock(
            product_id=self.product.id,
            new_quantity=25,
            user=self.user,
            notes="Test adjustment",
        )

        self.product.refresh_from_db()

        self.assertEqual(self.product.stock_quantity, 25)
        self.assertEqual(transaction.stock_before, 10)
        self.assertEqual(transaction.stock_after, 25)
        self.assertEqual(transaction.client_id, self.client_obj.id)

    def test_inventory_transaction_created(self):
        add_stock(
            product_id=self.product.id,
            quantity=3,
            user=self.user,
            reference_type="test",
        )

        self.assertEqual(
            InventoryTransaction.objects.count(),
            1,
        )