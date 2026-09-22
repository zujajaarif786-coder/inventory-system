from django.test import TestCase

from accounts.models import User
from categories.models import Category
from clients.models import Client
from inventory.models import InventoryTransaction
from products.models import Product


class ActivityLogTests(TestCase):
	def setUp(self):
		self.client_a = Client.objects.create(name="Client A", code="ACTIVITY-A")
		self.client_b = Client.objects.create(name="Client B", code="ACTIVITY-B")
		self.user_a = User.objects.create_user(
			username="activity-user-a",
			email="activity-a@example.com",
			password="TestPassword123!",
			role="MANAGER",
			client=self.client_a,
		)
		self.user_b = User.objects.create_user(
			username="activity-user-b",
			email="activity-b@example.com",
			password="TestPassword123!",
			role="MANAGER",
			client=self.client_b,
		)
		category_a = Category.objects.create(
			client=self.client_a,
			name="Category A",
			created_by=self.user_a,
		)
		category_b = Category.objects.create(
			client=self.client_b,
			name="Category B",
			created_by=self.user_b,
		)
		product_a = Product.objects.create(
			client=self.client_a,
			name="Product A",
			sku="ACTIVITY-A-1",
			category=category_a,
			stock_quantity=4,
		)
		product_b = Product.objects.create(
			client=self.client_b,
			name="Product B",
			sku="ACTIVITY-B-1",
			category=category_b,
			stock_quantity=8,
		)
		InventoryTransaction.objects.create(
			client=self.client_a,
			product=product_a,
			transaction_type="stock_in",
			quantity=4,
			stock_before=0,
			stock_after=4,
			created_by=self.user_a,
		)
		InventoryTransaction.objects.create(
			client=self.client_b,
			product=product_b,
			transaction_type="stock_out",
			quantity=-2,
			stock_before=10,
			stock_after=8,
			created_by=self.user_b,
		)

	def test_activity_logs_require_authentication(self):
		response = self.client.get("/api/activity-logs/")

		self.assertEqual(response.status_code, 401)

	def test_activity_logs_are_tenant_scoped(self):
		self.client.force_login(self.user_a)

		response = self.client.get("/api/activity-logs/")

		self.assertEqual(response.status_code, 200)
		logs = response.json()["logs"]
		self.assertEqual(len(logs), 1)
		self.assertEqual(logs[0]["product"], "Product A")

	def test_activity_logs_support_type_filter(self):
		self.client.force_login(self.user_a)

		response = self.client.get(
			"/api/activity-logs/?transaction_type=stock_out"
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["count"], 0)
