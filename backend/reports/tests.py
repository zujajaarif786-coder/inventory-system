from django.test import TestCase

from accounts.models import User
from categories.models import Category
from clients.models import Client
from products.models import Product


class ReportDashboardTests(TestCase):
	def setUp(self):
		self.client_a = Client.objects.create(name="Client A", code="REPORT-A")
		self.client_b = Client.objects.create(name="Client B", code="REPORT-B")
		self.user_a = User.objects.create_user(
			username="report-user-a",
			email="report-a@example.com",
			password="TestPassword123!",
			role="CLIENT_ADMIN",
			client=self.client_a,
		)
		self.category_a = Category.objects.create(
			client=self.client_a,
			name="Category A",
			created_by=self.user_a,
		)
		self.category_b = Category.objects.create(
			client=self.client_b,
			name="Category B",
		)
		Product.objects.create(
			client=self.client_a,
			name="Product A",
			sku="REPORT-A-1",
			category=self.category_a,
			cost_price=10,
			stock_quantity=3,
			minimum_stock_level=5,
		)
		Product.objects.create(
			client=self.client_b,
			name="Product B",
			sku="REPORT-B-1",
			category=self.category_b,
			cost_price=20,
			stock_quantity=9,
		)

	def test_report_is_authenticated_and_tenant_scoped(self):
		self.client.force_login(self.user_a)

		response = self.client.get("/api/reports/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["stats"]["total_products"], 1)
		self.assertEqual(response.json()["stats"]["total_categories"], 1)
		self.assertEqual(response.json()["stats"]["total_stock"], 3)
		self.assertEqual(response.json()["stats"]["low_stock"], 1)

	def test_report_requires_authentication(self):
		response = self.client.get("/api/reports/")

		self.assertEqual(response.status_code, 401)
