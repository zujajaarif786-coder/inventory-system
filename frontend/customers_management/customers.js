(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        const STORAGE_KEY = "stockmaster_customers";

        const addButton =
            document.getElementById("addCustomerButton");

        const searchInput =
            document.getElementById("customerSearch");

        const tableBody =
            document.getElementById("customersTableBody");

        if (!tableBody) {
            console.error("customersTableBody not found.");
            return;
        }

        // =====================================================
        // DEFAULT DATA
        // =====================================================

        const defaultCustomers = [
            {
                id: "CUS-001",
                name: "Acme Corporation",
                contact: "+1 (555) 123-4567",
                email: "contact@acme.com",
                city: "New York",
                country: "USA",
                purchases: 124500,
                status: "Active"
            },
            {
                id: "CUS-002",
                name: "Global Tech Ltd",
                contact: "+44 20 7946 0958",
                email: "sales@globaltech.co.uk",
                city: "London",
                country: "UK",
                purchases: 89200,
                status: "Active"
            }
        ];

        // =====================================================
        // STORAGE
        // =====================================================

        function getCustomers() {
            try {
                const saved =
                    localStorage.getItem(STORAGE_KEY);

                if (!saved) {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(defaultCustomers)
                    );

                    return [...defaultCustomers];
                }

                const data = JSON.parse(saved);

                return Array.isArray(data) ? data : [];

            } catch (error) {
                console.error(
                    "Customer storage error:",
                    error
                );

                return [];
            }
        }

        function saveCustomers(customers) {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(customers)
                );

                return true;

            } catch (error) {
                console.error(
                    "Unable to save customers:",
                    error
                );

                return false;
            }
        }

        // =====================================================
        // HELPERS
        // =====================================================

        function escapeHTML(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function formatCurrency(value) {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
            }).format(Number(value) || 0);
        }

        function generateCustomerId() {

            const customers = getCustomers();

            let number = customers.length + 1;

            let id =
                "CUS-" +
                String(number).padStart(3, "0");

            while (
                customers.some(
                    customer => customer.id === id
                )
            ) {
                number++;

                id =
                    "CUS-" +
                    String(number).padStart(3, "0");
            }

            return id;
        }

        // =====================================================
        // CUSTOMER FORM MODAL
        // =====================================================

        function openCustomerForm(customer = null) {

            const editing = Boolean(customer);

            const modal =
                document.createElement("div");

            modal.id = "customerModal";

            modal.className =
                "fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4";

            modal.innerHTML = `
                <div
                    class="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-2xl"
                >

                    <div
                        class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4"
                    >
                        <div>
                            <h2
                                class="text-xl font-semibold text-slate-900 dark:text-white"
                            >
                                ${editing ? "Edit Customer" : "Add Customer"}
                            </h2>

                            <p
                                class="text-sm text-slate-500 dark:text-slate-400 mt-1"
                            >
                                ${
                                    editing
                                        ? "Update customer information."
                                        : "Enter the customer information."
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            id="closeCustomerModal"
                            class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span class="material-symbols-outlined">
                                close
                            </span>
                        </button>
                    </div>


                    <form
                        id="customerForm"
                        class="p-6 space-y-4"
                    >

                        <div>
                            <label
                                class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                            >
                                Customer Name *
                            </label>

                            <input
                                id="customerName"
                                type="text"
                                required
                                value="${escapeHTML(customer?.name || "")}"
                                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                                placeholder="Enter customer name"
                            >
                        </div>


                        <div>
                            <label
                                class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                            >
                                Contact Number
                            </label>

                            <input
                                id="customerContact"
                                type="text"
                                value="${escapeHTML(customer?.contact || "")}"
                                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                                placeholder="Enter contact number"
                            >
                        </div>


                        <div>
                            <label
                                class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                            >
                                Email
                            </label>

                            <input
                                id="customerEmail"
                                type="email"
                                value="${escapeHTML(customer?.email || "")}"
                                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                                placeholder="customer@example.com"
                            >
                        </div>


                        <div class="grid grid-cols-2 gap-4">

                            <div>
                                <label
                                    class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                                >
                                    City
                                </label>

                                <input
                                    id="customerCity"
                                    type="text"
                                    value="${escapeHTML(customer?.city || "")}"
                                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                                    placeholder="City"
                                >
                            </div>


                            <div>
                                <label
                                    class="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                                >
                                    Country
                                </label>

                                <input
                                    id="customerCountry"
                                    type="text"
                                    value="${escapeHTML(customer?.country || "")}"
                                    class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
                                    placeholder="Country"
                                >
                            </div>

                        </div>


                        <div
                            id="customerFormError"
                            class="hidden rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm"
                        ></div>


                        <div
                            class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700"
                        >

                            <button
                                type="button"
                                id="cancelCustomerForm"
                                class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="px-4 py-2 rounded-lg bg-primary text-white"
                            >
                                ${
                                    editing
                                        ? "Save Changes"
                                        : "Create Customer"
                                }
                            </button>

                        </div>

                    </form>

                </div>
            `;

            document.body.appendChild(modal);

            const form =
                document.getElementById(
                    "customerForm"
                );

            const closeButton =
                document.getElementById(
                    "closeCustomerModal"
                );

            const cancelButton =
                document.getElementById(
                    "cancelCustomerForm"
                );

            const errorBox =
                document.getElementById(
                    "customerFormError"
                );


            function closeModal() {
                modal.remove();
            }


            closeButton.addEventListener(
                "click",
                closeModal
            );

            cancelButton.addEventListener(
                "click",
                closeModal
            );


            modal.addEventListener(
                "click",
                event => {

                    if (event.target === modal) {
                        closeModal();
                    }
                }
            );


            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    errorBox.classList.add(
                        "hidden"
                    );

                    const name =
                        document
                            .getElementById(
                                "customerName"
                            )
                            .value
                            .trim();

                    const contact =
                        document
                            .getElementById(
                                "customerContact"
                            )
                            .value
                            .trim();

                    const email =
                        document
                            .getElementById(
                                "customerEmail"
                            )
                            .value
                            .trim();

                    const city =
                        document
                            .getElementById(
                                "customerCity"
                            )
                            .value
                            .trim();

                    const country =
                        document
                            .getElementById(
                                "customerCountry"
                            )
                            .value
                            .trim();


                    // -----------------------------------------
                    // VALIDATION
                    // -----------------------------------------

                    if (!name) {

                        errorBox.textContent =
                            "Customer name is required.";

                        errorBox.classList.remove(
                            "hidden"
                        );

                        return;
                    }


                    if (
                        email &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            .test(email)
                    ) {

                        errorBox.textContent =
                            "Please enter a valid email address.";

                        errorBox.classList.remove(
                            "hidden"
                        );

                        return;
                    }


                    const customers =
                        getCustomers();


                    // -----------------------------------------
                    // EDIT
                    // -----------------------------------------

                    if (editing) {

                        const index =
                            customers.findIndex(
                                item =>
                                    item.id ===
                                    customer.id
                            );


                        if (index === -1) {

                            errorBox.textContent =
                                "Customer no longer exists.";

                            errorBox.classList.remove(
                                "hidden"
                            );

                            return;
                        }


                        customers[index] = {

                            ...customers[index],

                            name,

                            contact,

                            email,

                            city,

                            country
                        };


                        if (
                            !saveCustomers(
                                customers
                            )
                        ) {

                            errorBox.textContent =
                                "Unable to save changes.";

                            errorBox.classList.remove(
                                "hidden"
                            );

                            return;
                        }


                        closeModal();

                        renderCustomers();

                        updateStatistics();

                        showToast(
                            "Customer updated successfully."
                        );

                        return;
                    }


                    // -----------------------------------------
                    // CREATE
                    // -----------------------------------------

                    const newCustomer = {

                        id:
                            generateCustomerId(),

                        name,

                        contact,

                        email,

                        city,

                        country,

                        purchases: 0,

                        status: "Active"
                    };


                    customers.push(
                        newCustomer
                    );


                    if (
                        !saveCustomers(
                            customers
                        )
                    ) {

                        errorBox.textContent =
                            "Unable to create customer.";

                        errorBox.classList.remove(
                            "hidden"
                        );

                        return;
                    }


                    closeModal();

                    renderCustomers();

                    updateStatistics();

                    showToast(
                        "Customer created successfully."
                    );
                }
            );
        }

        // =====================================================
        // ADD BUTTON
        // =====================================================

        addButton?.addEventListener(
            "click",
            () => {

                openCustomerForm();
            }
        );

        // =====================================================
        // RENDER
        // =====================================================

        function renderCustomers(
            customers = getCustomers()
        ) {

            tableBody.innerHTML = "";

            if (customers.length === 0) {

                tableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="6"
                            class="px-6 py-12 text-center"
                        >
                            <span
                                class="material-symbols-outlined text-5xl text-slate-400"
                            >
                                person_search
                            </span>

                            <p class="mt-3 font-semibold">
                                No customers found
                            </p>

                            <p class="text-sm text-slate-500 mt-1">
                                Add a customer or change your search.
                            </p>
                        </td>
                    </tr>
                `;

                return;
            }


            customers.forEach(customer => {

                const row =
                    document.createElement("tr");

                row.className =
                    "hover:bg-surface-container-low dark:hover:bg-surface-variant/50";


                const statusClass =
                    customer.status === "Active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";


                row.innerHTML = `

                    <td class="px-lg py-4">

                        <p class="font-body-md font-semibold">
                            ${escapeHTML(customer.name)}
                        </p>

                        <p class="text-[11px] text-secondary">
                            ${escapeHTML(customer.city || "—")},
                            ${escapeHTML(customer.country || "")}
                        </p>

                    </td>


                    <td class="px-lg py-4">
                        ${escapeHTML(customer.contact || "—")}
                    </td>


                    <td class="px-lg py-4">
                        ${escapeHTML(customer.email || "—")}
                    </td>


                    <td class="px-lg py-4">
                        ${formatCurrency(customer.purchases)}
                    </td>


                    <td class="px-lg py-4">

                        <span
                            class="px-3 py-1 ${statusClass} rounded-full text-xs font-semibold"
                        >
                            ${escapeHTML(customer.status)}
                        </span>

                    </td>


                    <td class="px-lg py-4 text-right">

                        <button
                            type="button"
                            class="view-customer p-2 text-primary rounded"
                            data-id="${escapeHTML(customer.id)}"
                            title="View"
                        >
                            <span class="material-symbols-outlined">
                                visibility
                            </span>
                        </button>


                        <button
                            type="button"
                            class="edit-customer p-2 text-primary rounded"
                            data-id="${escapeHTML(customer.id)}"
                            title="Edit"
                        >
                            <span class="material-symbols-outlined">
                                edit
                            </span>
                        </button>


                        <button
                            type="button"
                            class="archive-customer p-2 text-orange-600 rounded"
                            data-id="${escapeHTML(customer.id)}"
                            title="Archive"
                        >
                            <span class="material-symbols-outlined">
                                ${
                                    customer.status === "Archived"
                                        ? "unarchive"
                                        : "archive"
                                }
                            </span>
                        </button>

                    </td>
                `;


                tableBody.appendChild(row);
            });


            attachActionEvents();
        }

        // =====================================================
        // ACTION EVENTS
        // =====================================================

        function attachActionEvents() {

            document
                .querySelectorAll(".view-customer")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const customer =
                                getCustomers()
                                    .find(
                                        item =>
                                            item.id ===
                                            button.dataset.id
                                    );

                            if (!customer) {
                                alert(
                                    "Customer not found."
                                );
                                return;
                            }

                            alert(
                                `Customer Details\n\n` +
                                `Name: ${customer.name}\n` +
                                `Contact: ${customer.contact || "Not provided"}\n` +
                                `Email: ${customer.email || "Not provided"}\n` +
                                `Location: ${customer.city || "—"}, ${customer.country || "—"}\n` +
                                `Purchases: ${formatCurrency(customer.purchases)}\n` +
                                `Status: ${customer.status}`
                            );
                        }
                    );
                });


            document
                .querySelectorAll(".edit-customer")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const customer =
                                getCustomers()
                                    .find(
                                        item =>
                                            item.id ===
                                            button.dataset.id
                                    );

                            if (!customer) {
                                alert(
                                    "Customer not found."
                                );
                                return;
                            }

                            openCustomerForm(
                                customer
                            );
                        }
                    );
                });


            document
                .querySelectorAll(".archive-customer")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const customers =
                                getCustomers();

                            const customer =
                                customers.find(
                                    item =>
                                        item.id ===
                                        button.dataset.id
                                );

                            if (!customer) {
                                return;
                            }

                            const archived =
                                customer.status ===
                                "Archived";

                            const confirmed =
                                window.confirm(
                                    `Are you sure you want to ${
                                        archived
                                            ? "restore"
                                            : "archive"
                                    } "${customer.name}"?`
                                );

                            if (!confirmed) {
                                return;
                            }

                            customer.status =
                                archived
                                    ? "Active"
                                    : "Archived";

                            saveCustomers(
                                customers
                            );

                            renderCustomers();

                            updateStatistics();

                            showToast(
                                archived
                                    ? "Customer restored successfully."
                                    : "Customer archived successfully."
                            );
                        }
                    );
                });
        }

        // =====================================================
        // SEARCH
        // =====================================================

        searchInput?.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .trim()
                        .toLowerCase();

                const customers =
                    getCustomers();

                if (!query) {

                    renderCustomers(
                        customers
                    );

                    return;
                }

                const filtered =
                    customers.filter(
                        customer =>
                            [
                                customer.id,
                                customer.name,
                                customer.contact,
                                customer.email,
                                customer.city,
                                customer.country,
                                customer.status
                            ]
                                .join(" ")
                                .toLowerCase()
                                .includes(query)
                    );

                renderCustomers(
                    filtered
                );
            }
        );

        // =====================================================
        // STATISTICS
        // =====================================================

        function updateStatistics() {

            const customers =
                getCustomers();

            const total =
                customers.length;

            const active =
                customers.filter(
                    customer =>
                        customer.status === "Active"
                ).length;

            const purchases =
                customers.reduce(
                    (sum, customer) =>
                        sum +
                        Number(
                            customer.purchases || 0
                        ),
                    0
                );

            const cards =
                document.querySelectorAll(
                    "main .grid > div"
                );

            if (cards.length >= 3) {

                const totalElement =
                    cards[0].querySelector("h3");

                if (totalElement) {
                    totalElement.textContent =
                        total;
                }


                const activeElement =
                    cards[1].querySelector("h3");

                if (activeElement) {
                    activeElement.textContent =
                        active;
                }


                const purchasesElement =
                    cards[2].querySelector("h3");

                if (purchasesElement) {
                    purchasesElement.textContent =
                        formatCurrency(
                            purchases
                        );
                }
            }
        }

        // =====================================================
        // TOAST
        // =====================================================

        function showToast(message) {

            const toast =
                document.createElement("div");

            toast.className =
                "fixed top-5 right-5 z-[300] rounded-lg bg-slate-900 text-white px-4 py-3 shadow-xl text-sm";

            toast.textContent =
                message;

            document.body.appendChild(
                toast
            );

            setTimeout(
                () => toast.remove(),
                3000
            );
        }

        // =====================================================
        // INITIALIZE
        // =====================================================

        renderCustomers();

        updateStatistics();

        console.log(
            "StockMaster Customers module loaded."
        );
    });

})();