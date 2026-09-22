from django.test import TestCase
from django.contrib.auth import get_user_model
from django.test import Client as DjangoClient

from clients.models import Client
from categories.models import Category
from products.models import Product
from accounts.models import PasswordResetToken


User = get_user_model()


class AuthenticationAndTenantTests(TestCase):

    def setUp(self):
        self.client_a = Client.objects.create(
            name="Client A",
            code="CLIENTA",
        )

        self.client_b = Client.objects.create(
            name="Client B",
            code="CLIENTB",
        )

        self.admin_a = User.objects.create_user(
            username="admin_a",
            email="admina@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_a,
        )

        self.admin_b = User.objects.create_user(
            username="admin_b",
            email="adminb@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_b,
        )

        self.super_admin = User.objects.create_user(
            username="super_admin",
            email="super@example.com",
            password="TestPassword123!",
            role="SUPER_ADMIN",
        )

        self.category_a = Category.objects.create(
            client=self.client_a,
            name="Category A",
            created_by=self.admin_a,
        )

        self.category_b = Category.objects.create(
            client=self.client_b,
            name="Category B",
            created_by=self.admin_b,
        )

        self.product_a = Product.objects.create(
            client=self.client_a,
            name="Product A",
            sku="PRODUCT-A",
            category=self.category_a,
            cost_price=100,
            selling_price=150,
            stock_quantity=10,
        )

        self.product_b = Product.objects.create(
            client=self.client_b,
            name="Product B",
            sku="PRODUCT-B",
            category=self.category_b,
            cost_price=200,
            selling_price=300,
            stock_quantity=20,
        )

        self.http = DjangoClient()

    def test_client_admin_can_login(self):
        response = self.http.post(
            "/api/accounts/login/",
            {
                "email": "admina@example.com",
                "password": "TestPassword123!",
            },
        )

        self.assertEqual(response.status_code, 200)

    def test_forgot_password_request_is_generic_and_creates_reset_token(self):
        response = self.http.post(
            "/api/accounts/forgot-password/",
            {"email": "admina@example.com"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("If that account exists", data["message"])
        self.assertTrue(
            PasswordResetToken.objects.filter(user=self.admin_a).exists()
        )

    def test_reset_password_works_with_valid_token(self):
        raw_token, reset_token = PasswordResetToken.create_for_user(self.admin_a)

        response = self.http.post(
            "/api/accounts/reset-password/",
            {
                "token": raw_token,
                "password": "NewPassword456!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.admin_a.refresh_from_db()
        self.assertTrue(self.admin_a.check_password("NewPassword456!"))
        reset_token.refresh_from_db()
        self.assertIsNotNone(reset_token.used_at)

    def test_client_admin_has_client(self):
        self.assertEqual(
            self.admin_a.client_id,
            self.client_a.id,
        )

    def test_client_admin_cannot_see_other_client_products(self):
        self.http.force_login(self.admin_a)

        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        products = data.get(
            "products",
            data.get(
                "results",
                data.get("data", []),
            ),
        )

        product_ids = [
            product.get("id")
            for product in products
        ]

        self.assertIn(
            self.product_a.id,
            product_ids,
        )

        self.assertNotIn(
            self.product_b.id,
            product_ids,
        )

    def test_super_admin_has_no_client_restriction(self):
        self.assertIsNone(
            self.super_admin.client_id
        )

    def test_unauthenticated_user_cannot_access_products(self):
        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_client_admin_cannot_access_other_client_product_detail(self):
        self.http.force_login(self.admin_a)

        response = self.http.get(
            f"/api/products/{self.product_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_client_admin_cannot_modify_other_client_product(self):
        self.http.force_login(self.admin_a)

        response = self.http.patch(
            f"/api/products/{self.product_b.id}/",
            data={
                "name": "Hacked Product",
            },
            content_type="application/json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertEqual(
            self.product_b.name,
            "Product B",
        )

    def test_client_admin_cannot_delete_other_client_product(self):
        self.http.force_login(self.admin_a)

        response = self.http.delete(
            f"/api/products/{self.product_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertTrue(
            self.product_b.is_active
        )