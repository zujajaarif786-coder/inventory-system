from django.contrib.auth import get_user_model
from django.test import Client as DjangoClient
from django.test import TestCase

from categories.models import Category
from clients.models import Client
from products.models import Product


User = get_user_model()


class ProductsAPISecurityTests(TestCase):
    """
    API-level security tests for the Products module.

    Security policy:

    SUPER_ADMIN
        - Can read products from all clients.
        - Can create/update/delete products for any active client.

    CLIENT_ADMIN
        - Can read products belonging to their own client.
        - Can create/update/delete products belonging to their own client.
        - Cannot access another client's products.

    MANAGER
        - Can read products belonging to their own client.
        - Can create/update/delete products belonging to their own client.
        - Cannot access another client's products.

    STAFF
        - Can read products belonging to their own client.
        - Cannot create/update/delete products.
        - Cannot access another client's products.

    Tenant isolation is tested at the HTTP/API boundary rather than
    only through service/model tests.
    """

    def setUp(self):
        self.client_a = Client.objects.create(
            name="Client A",
            code="CLIENTA",
            is_active=True,
        )

        self.client_b = Client.objects.create(
            name="Client B",
            code="CLIENTB",
            is_active=True,
        )

        self.super_admin = User.objects.create_user(
            username="super_admin",
            email="super@example.com",
            password="TestPassword123!",
            role="SUPER_ADMIN",
            client=None,
            is_superuser=False,
        )

        self.admin_a = User.objects.create_user(
            username="admin_a",
            email="admina@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_a,
        )

        self.manager_a = User.objects.create_user(
            username="manager_a",
            email="managera@example.com",
            password="TestPassword123!",
            role="MANAGER",
            client=self.client_a,
        )

        self.staff_a = User.objects.create_user(
            username="staff_a",
            email="staffa@example.com",
            password="TestPassword123!",
            role="STAFF",
            client=self.client_a,
        )

        self.admin_b = User.objects.create_user(
            username="admin_b",
            email="adminb@example.com",
            password="TestPassword123!",
            role="CLIENT_ADMIN",
            client=self.client_b,
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
            description="Client A product",
            cost_price=100,
            selling_price=150,
            stock_quantity=10,
            minimum_stock_level=2,
        )

        self.product_b = Product.objects.create(
            client=self.client_b,
            name="Product B",
            sku="PRODUCT-B",
            category=self.category_b,
            description="Client B product",
            cost_price=200,
            selling_price=300,
            stock_quantity=20,
            minimum_stock_level=5,
        )

        self.http = DjangoClient()

    # =========================================================
    # Helpers
    # =========================================================

    def login_as(self, user):
        self.http.force_login(user)

    def product_create_payload(
        self,
        sku="NEW-SKU",
        category_id=None,
        **extra,
    ):
        return {
            "name": extra.pop("name", "New Product"),
            "sku": sku,
            "description": extra.pop(
                "description",
                "New product description",
            ),
            "category_id": (
                category_id
                if category_id is not None
                else self.category_a.id
            ),
            "cost_price": extra.pop(
                "cost_price",
                100,
            ),
            "selling_price": extra.pop(
                "selling_price",
                150,
            ),
            "stock_quantity": extra.pop(
                "stock_quantity",
                5,
            ),
            "minimum_stock_level": extra.pop(
                "minimum_stock_level",
                1,
            ),
            **extra,
        }

    def post_product(self, payload):
        return self.http.post(
            "/api/products/",
            data=payload,
            content_type="application/json",
        )

    def put_product(self, product_id, payload):
        return self.http.put(
            f"/api/products/{product_id}/",
            data=payload,
            content_type="application/json",
        )

    def delete_product(self, product_id):
        return self.http.delete(
            f"/api/products/{product_id}/"
        )

    # =========================================================
    # AUTHENTICATION
    # =========================================================

    def test_anonymous_user_cannot_list_products(self):
        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_anonymous_user_cannot_create_product(self):
        response = self.post_product(
            self.product_create_payload()
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_anonymous_user_cannot_update_product(self):
        response = self.put_product(
            self.product_a.id,
            {
                "name": "Unauthorised Update",
            },
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    def test_anonymous_user_cannot_delete_product(self):
        response = self.delete_product(
            self.product_a.id
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # =========================================================
    # SUPER ADMIN
    # =========================================================

    def test_super_admin_can_list_all_clients_products(self):
        self.login_as(self.super_admin)

        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        product_ids = [
            product["id"]
            for product in data["products"]
        ]

        self.assertIn(
            self.product_a.id,
            product_ids,
        )

        self.assertIn(
            self.product_b.id,
            product_ids,
        )

    def test_super_admin_can_create_product_for_client_a(self):
        self.login_as(self.super_admin)

        payload = self.product_create_payload(
            sku="SUPER-A-001",
            category_id=self.category_a.id,
            client_id=self.client_a.id,
        )

        response = self.post_product(payload)

        self.assertEqual(
            response.status_code,
            201,
        )

        product = Product.objects.get(
            sku="SUPER-A-001"
        )

        self.assertEqual(
            product.client_id,
            self.client_a.id,
        )

    def test_super_admin_can_create_product_for_client_b(self):
        self.login_as(self.super_admin)

        payload = self.product_create_payload(
            sku="SUPER-B-001",
            category_id=self.category_b.id,
            client_id=self.client_b.id,
        )

        response = self.post_product(payload)

        self.assertEqual(
            response.status_code,
            201,
        )

        product = Product.objects.get(
            sku="SUPER-B-001"
        )

        self.assertEqual(
            product.client_id,
            self.client_b.id,
        )

    def test_super_admin_can_update_client_a_product(self):
        self.login_as(self.super_admin)

        response = self.put_product(
            self.product_a.id,
            {
                "name": "Super Admin Updated A",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertEqual(
            self.product_a.name,
            "Super Admin Updated A",
        )

    def test_super_admin_can_update_client_b_product(self):
        self.login_as(self.super_admin)

        response = self.put_product(
            self.product_b.id,
            {
                "name": "Super Admin Updated B",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_b.refresh_from_db()

        self.assertEqual(
            self.product_b.name,
            "Super Admin Updated B",
        )

    def test_super_admin_can_delete_client_a_product(self):
        self.login_as(self.super_admin)

        response = self.delete_product(
            self.product_a.id
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertFalse(
            self.product_a.is_active
        )

    # =========================================================
    # CLIENT ADMIN
    # =========================================================

    def test_client_admin_can_list_only_own_products(self):
        self.login_as(self.admin_a)

        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        product_ids = [
            product["id"]
            for product in response.json()["products"]
        ]

        self.assertIn(
            self.product_a.id,
            product_ids,
        )

        self.assertNotIn(
            self.product_b.id,
            product_ids,
        )

    def test_client_admin_can_read_own_product(self):
        self.login_as(self.admin_a)

        response = self.http.get(
            f"/api/products/{self.product_a.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.json()["product"]["id"],
            self.product_a.id,
        )

    def test_client_admin_cannot_read_other_client_product(self):
        self.login_as(self.admin_a)

        response = self.http.get(
            f"/api/products/{self.product_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_client_admin_can_create_own_client_product(self):
        self.login_as(self.admin_a)

        response = self.post_product(
            self.product_create_payload(
                sku="ADMIN-A-001",
                category_id=self.category_a.id,
            )
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        product = Product.objects.get(
            sku="ADMIN-A-001"
        )

        self.assertEqual(
            product.client_id,
            self.client_a.id,
        )

    def test_client_admin_cannot_create_using_other_client_category(
        self,
    ):
        self.login_as(self.admin_a)

        response = self.post_product(
            self.product_create_payload(
                sku="ADMIN-CROSS-001",
                category_id=self.category_b.id,
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="ADMIN-CROSS-001"
            ).exists()
        )

    def test_client_admin_cannot_create_for_other_client_with_client_id(
        self,
    ):
        self.login_as(self.admin_a)

        response = self.post_product(
            self.product_create_payload(
                sku="ADMIN-CROSS-002",
                category_id=self.category_b.id,
                client_id=self.client_b.id,
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="ADMIN-CROSS-002"
            ).exists()
        )

    def test_client_admin_can_update_own_product(self):
        self.login_as(self.admin_a)

        response = self.put_product(
            self.product_a.id,
            {
                "name": "Admin Updated Product",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertEqual(
            self.product_a.name,
            "Admin Updated Product",
        )

    def test_client_admin_cannot_update_other_client_product(self):
        self.login_as(self.admin_a)

        response = self.put_product(
            self.product_b.id,
            {
                "name": "Cross Client Update",
            },
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

    def test_client_admin_can_delete_own_product(self):
        self.login_as(self.admin_a)

        response = self.delete_product(
            self.product_a.id
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertFalse(
            self.product_a.is_active
        )

    def test_client_admin_cannot_delete_other_client_product(self):
        self.login_as(self.admin_a)

        response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertTrue(
            self.product_b.is_active
        )

    # =========================================================
    # MANAGER
    # =========================================================

    def test_manager_can_list_only_own_products(self):
        self.login_as(self.manager_a)

        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        product_ids = [
            product["id"]
            for product in response.json()["products"]
        ]

        self.assertIn(
            self.product_a.id,
            product_ids,
        )

        self.assertNotIn(
            self.product_b.id,
            product_ids,
        )

    def test_manager_can_read_own_product(self):
        self.login_as(self.manager_a)

        response = self.http.get(
            f"/api/products/{self.product_a.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_manager_cannot_read_other_client_product(self):
        self.login_as(self.manager_a)

        response = self.http.get(
            f"/api/products/{self.product_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_manager_can_create_own_client_product(self):
        self.login_as(self.manager_a)

        response = self.post_product(
            self.product_create_payload(
                sku="MANAGER-A-001",
                category_id=self.category_a.id,
            )
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        product = Product.objects.get(
            sku="MANAGER-A-001"
        )

        self.assertEqual(
            product.client_id,
            self.client_a.id,
        )

    def test_manager_cannot_create_using_other_client_category(
        self,
    ):
        self.login_as(self.manager_a)

        response = self.post_product(
            self.product_create_payload(
                sku="MANAGER-CROSS-001",
                category_id=self.category_b.id,
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="MANAGER-CROSS-001"
            ).exists()
        )

    def test_manager_can_update_own_product(self):
        self.login_as(self.manager_a)

        response = self.put_product(
            self.product_a.id,
            {
                "name": "Manager Updated Product",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertEqual(
            self.product_a.name,
            "Manager Updated Product",
        )

    def test_manager_cannot_update_other_client_product(self):
        self.login_as(self.manager_a)

        response = self.put_product(
            self.product_b.id,
            {
                "name": "Manager Cross Client Update",
            },
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

    def test_manager_can_delete_own_product(self):
        self.login_as(self.manager_a)

        response = self.delete_product(
            self.product_a.id
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.product_a.refresh_from_db()

        self.assertFalse(
            self.product_a.is_active
        )

    def test_manager_cannot_delete_other_client_product(self):
        self.login_as(self.manager_a)

        response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertTrue(
            self.product_b.is_active
        )

    # =========================================================
    # STAFF
    # =========================================================

    def test_staff_can_list_only_own_products(self):
        self.login_as(self.staff_a)

        response = self.http.get(
            "/api/products/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        product_ids = [
            product["id"]
            for product in response.json()["products"]
        ]

        self.assertIn(
            self.product_a.id,
            product_ids,
        )

        self.assertNotIn(
            self.product_b.id,
            product_ids,
        )

    def test_staff_can_read_own_product(self):
        self.login_as(self.staff_a)

        response = self.http.get(
            f"/api/products/{self.product_a.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_staff_cannot_read_other_client_product(self):
        self.login_as(self.staff_a)

        response = self.http.get(
            f"/api/products/{self.product_b.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_staff_cannot_create_product(self):
        self.login_as(self.staff_a)

        response = self.post_product(
            self.product_create_payload(
                sku="STAFF-A-001",
                category_id=self.category_a.id,
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="STAFF-A-001"
            ).exists()
        )

    def test_staff_cannot_create_using_other_client_category(
        self,
    ):
        self.login_as(self.staff_a)

        response = self.post_product(
            self.product_create_payload(
                sku="STAFF-CROSS-001",
                category_id=self.category_b.id,
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="STAFF-CROSS-001"
            ).exists()
        )

    def test_staff_cannot_update_own_product(self):
        self.login_as(self.staff_a)

        response = self.put_product(
            self.product_a.id,
            {
                "name": "Staff Unauthorized Update",
            },
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.product_a.refresh_from_db()

        self.assertEqual(
            self.product_a.name,
            "Product A",
        )

    def test_staff_cannot_update_other_client_product(self):
        self.login_as(self.staff_a)

        response = self.put_product(
            self.product_b.id,
            {
                "name": "Staff Cross Client Update",
            },
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

    def test_staff_cannot_delete_own_product(self):
        self.login_as(self.staff_a)

        response = self.delete_product(
            self.product_a.id
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.product_a.refresh_from_db()

        self.assertTrue(
            self.product_a.is_active
        )

    def test_staff_cannot_delete_other_client_product(self):
        self.login_as(self.staff_a)

        response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertTrue(
            self.product_b.is_active
        )

    # =========================================================
    # CROSS-CLIENT CREATE
    # =========================================================

    def test_client_admin_cannot_create_product_with_other_client_category(
        self,
    ):
        self.login_as(self.admin_a)

        response = self.post_product(
            {
                "name": "Attack Product",
                "sku": "ATTACK-001",
                "description": "Cross-client attempt",
                "client_id": self.client_b.id,
                "category_id": self.category_b.id,
                "cost_price": 100,
                "selling_price": 150,
                "stock_quantity": 1,
                "minimum_stock_level": 0,
            }
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="ATTACK-001"
            ).exists()
        )

    def test_manager_cannot_create_product_with_other_client_category(
        self,
    ):
        self.login_as(self.manager_a)

        response = self.post_product(
            {
                "name": "Attack Product",
                "sku": "ATTACK-002",
                "description": "Cross-client attempt",
                "client_id": self.client_b.id,
                "category_id": self.category_b.id,
                "cost_price": 100,
                "selling_price": 150,
                "stock_quantity": 1,
                "minimum_stock_level": 0,
            }
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="ATTACK-002"
            ).exists()
        )

    def test_staff_cannot_create_product_for_other_client(
        self,
    ):
        self.login_as(self.staff_a)

        response = self.post_product(
            {
                "name": "Attack Product",
                "sku": "ATTACK-003",
                "description": "Cross-client attempt",
                "client_id": self.client_b.id,
                "category_id": self.category_b.id,
                "cost_price": 100,
                "selling_price": 150,
                "stock_quantity": 1,
                "minimum_stock_level": 0,
            }
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            Product.objects.filter(
                sku="ATTACK-003"
            ).exists()
        )

    # =========================================================
    # CROSS-CLIENT UPDATE / DELETE
    # =========================================================

    def test_client_admin_cannot_modify_or_delete_client_b_product(
        self,
    ):
        self.login_as(self.admin_a)

        update_response = self.put_product(
            self.product_b.id,
            {
                "name": "Client A Attack",
            },
        )

        delete_response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            update_response.status_code,
            404,
        )

        self.assertEqual(
            delete_response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertEqual(
            self.product_b.name,
            "Product B",
        )

        self.assertTrue(
            self.product_b.is_active
        )

    def test_manager_cannot_modify_or_delete_client_b_product(
        self,
    ):
        self.login_as(self.manager_a)

        update_response = self.put_product(
            self.product_b.id,
            {
                "name": "Manager Attack",
            },
        )

        delete_response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            update_response.status_code,
            404,
        )

        self.assertEqual(
            delete_response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertEqual(
            self.product_b.name,
            "Product B",
        )

        self.assertTrue(
            self.product_b.is_active
        )

    def test_staff_cannot_modify_or_delete_client_b_product(
        self,
    ):
        self.login_as(self.staff_a)

        update_response = self.put_product(
            self.product_b.id,
            {
                "name": "Staff Attack",
            },
        )

        delete_response = self.delete_product(
            self.product_b.id
        )

        self.assertEqual(
            update_response.status_code,
            404,
        )

        self.assertEqual(
            delete_response.status_code,
            404,
        )

        self.product_b.refresh_from_db()

        self.assertEqual(
            self.product_b.name,
            "Product B",
        )

        self.assertTrue(
            self.product_b.is_active
        )