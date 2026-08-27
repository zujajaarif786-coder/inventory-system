(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        const store =
            window.StockMaster?.SupplierStore;

        if (!store) {
            console.error(
                "SupplierStore is not loaded."
            );
            return;
        }


        // =====================================================
        // ELEMENTS
        // =====================================================

        const tableBody =
            document.getElementById(
                "suppliersTableBody"
            );

        const searchInput =
            document.getElementById(
                "supplierSearch"
            );

        const addSupplierButton =
            document.getElementById(
                "addSupplierButton"
            );

        const totalSuppliers =
            document.getElementById(
                "totalSuppliers"
            );

        const activeSuppliers =
            document.getElementById(
                "activeSuppliers"
            );

        const totalPurchases =
            document.getElementById(
                "totalPurchases"
            );


        if (!tableBody) {
            console.error(
                "Supplier table body not found."
            );
            return;
        }


        // =====================================================
        // STATE
        // =====================================================

        let suppliers = store.getAll();


        // =====================================================
        // ADD SUPPLIER
        // =====================================================

        addSupplierButton?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "supplier_form.html";
            }
        );


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

                render(query);
            }
        );


        // =====================================================
        // RENDER
        // =====================================================

        function render(query = "") {

            suppliers =
                store.getAll();

            const filtered =
                suppliers.filter(
                    supplier => {

                        if (!query) {
                            return true;
                        }

                        return [
                            supplier.companyName,
                            supplier.contactPerson,
                            supplier.email,
                            supplier.code,
                            supplier.phone,
                            supplier.city,
                            supplier.country
                        ]
                            .join(" ")
                            .toLowerCase()
                            .includes(query);
                    }
                );


            updateStats();

            tableBody.innerHTML = "";


            if (filtered.length === 0) {

                tableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="px-6 py-12 text-center"
                        >
                            <div class="flex flex-col items-center">
                                <span
                                    class="material-symbols-outlined text-4xl text-outline mb-3"
                                >
                                    search_off
                                </span>

                                <p class="font-semibold">
                                    No suppliers found
                                </p>

                                <p class="text-sm text-secondary mt-1">
                                    Try another search or add a new supplier.
                                </p>
                            </div>
                        </td>
                    </tr>
                `;

                return;
            }


            filtered.forEach(
                supplier => {

                    tableBody.appendChild(
                        createRow(supplier)
                    );
                }
            );
        }


        // =====================================================
        // CREATE TABLE ROW
        // =====================================================

        function createRow(supplier) {

            const row =
                document.createElement("tr");

            row.className =
                "hover:bg-surface-container-low dark:hover:bg-surface-variant/50 transition-colors";


            const statusClass =
                supplier.status === "Active"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : supplier.status === "Archived"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";


            row.innerHTML = `

                <td class="px-lg py-4">

                    <p
                        class="font-body-md font-semibold text-on-surface dark:text-inverse-on-surface"
                    >
                        ${escapeHtml(
                            supplier.companyName
                        )}
                    </p>

                    <p
                        class="text-[11px] text-secondary dark:text-outline-variant"
                    >
                        ${escapeHtml(
                            supplier.code || ""
                        )}
                    </p>

                </td>


                <td
                    class="px-lg py-4 font-body-md text-on-surface dark:text-inverse-on-surface"
                >
                    ${escapeHtml(
                        supplier.contactPerson || "-"
                    )}
                </td>


                <td
                    class="px-lg py-4 font-body-md text-secondary dark:text-outline-variant"
                >
                    ${escapeHtml(
                        supplier.email || "-"
                    )}
                </td>


                <td
                    class="px-lg py-4 font-body-md text-on-surface dark:text-inverse-on-surface"
                >
                    ${Number(
                        supplier.products || 0
                    )}
                </td>


                <td
                    class="px-lg py-4 font-body-md text-on-surface dark:text-inverse-on-surface"
                >
                    ${formatCurrency(
                        supplier.purchases || 0
                    )}
                </td>


                <td class="px-lg py-4">

                    <span
                        class="px-3 py-1 ${statusClass} rounded-full text-label-sm font-semibold"
                    >
                        ${escapeHtml(
                            supplier.status
                        )}
                    </span>

                </td>


                <td
                    class="px-lg py-4 text-right whitespace-nowrap"
                >

                    <button
                        type="button"
                        class="supplier-action p-2 text-primary hover:bg-primary/10 rounded transition-all"
                        data-action="view"
                        data-id="${supplier.id}"
                        title="View supplier"
                        aria-label="View supplier"
                    >
                        <span class="material-symbols-outlined">
                            visibility
                        </span>
                    </button>


                    <button
                        type="button"
                        class="supplier-action p-2 text-primary hover:bg-primary/10 rounded transition-all"
                        data-action="edit"
                        data-id="${supplier.id}"
                        title="Edit supplier"
                        aria-label="Edit supplier"
                    >
                        <span class="material-symbols-outlined">
                            edit
                        </span>
                    </button>


                    ${
                        supplier.status !== "Archived"
                            ? `
                                <button
                                    type="button"
                                    class="supplier-action p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-all"
                                    data-action="archive"
                                    data-id="${supplier.id}"
                                    title="Archive supplier"
                                    aria-label="Archive supplier"
                                >
                                    <span class="material-symbols-outlined">
                                        archive
                                    </span>
                                </button>
                            `
                            : ""
                    }

                </td>
            `;

            return row;
        }


        // =====================================================
        // ACTION BUTTONS
        // =====================================================

        tableBody.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".supplier-action"
                    );

                if (!button) {
                    return;
                }

                const id =
                    button.dataset.id;

                const action =
                    button.dataset.action;


                if (!id || !action) {
                    return;
                }


                const supplier =
                    store.getById(id);

                if (!supplier) {

                    showToast(
                        "Supplier not found.",
                        "error"
                    );

                    return;
                }


                // VIEW
                if (action === "view") {

                    window.location.href =
                        `supplier_details.html?id=${encodeURIComponent(id)}`;

                    return;
                }


                // EDIT
                if (action === "edit") {

                    window.location.href =
                        `supplier_form.html?id=${encodeURIComponent(id)}`;

                    return;
                }


                // ARCHIVE
                if (action === "archive") {

                    archiveSupplier(
                        supplier
                    );
                }
            }
        );


        // =====================================================
        // ARCHIVE
        // =====================================================

        function archiveSupplier(
            supplier
        ) {

            const confirmed =
                window.confirm(
                    `Are you sure you want to archive "${supplier.companyName}"?`
                );

            if (!confirmed) {
                return;
            }


            const result =
                store.archive(
                    supplier.id
                );


            if (!result) {

                showToast(
                    "Unable to archive supplier.",
                    "error"
                );

                return;
            }


            render(
                searchInput?.value
                    .trim()
                    .toLowerCase() || ""
            );


            showToast(
                `${supplier.companyName} has been archived.`,
                "success"
            );
        }


        // =====================================================
        // STATISTICS
        // =====================================================

        function updateStats() {

            suppliers =
                store.getAll();

            const active =
                suppliers.filter(
                    supplier =>
                        supplier.status === "Active"
                );

            const purchases =
                suppliers.reduce(
                    (total, supplier) =>
                        total +
                        Number(
                            supplier.purchases || 0
                        ),
                    0
                );


            if (totalSuppliers) {
                totalSuppliers.textContent =
                    suppliers.length;
            }

            if (activeSuppliers) {
                activeSuppliers.textContent =
                    active.length;
            }

            if (totalPurchases) {
                totalPurchases.textContent =
                    formatCurrency(
                        purchases
                    );
            }
        }


        // =====================================================
        // CURRENCY
        // =====================================================

        function formatCurrency(
            value
        ) {

            return new Intl.NumberFormat(
                "en-US",
                {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0
                }
            ).format(
                Number(value) || 0
            );
        }


        // =====================================================
        // HTML SAFETY
        // =====================================================

        function escapeHtml(value) {

            return String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");
        }


        // =====================================================
        // TOAST
        // =====================================================

        function showToast(
            message,
            type = "info"
        ) {

            let container =
                document.getElementById(
                    "supplierToastContainer"
                );


            if (!container) {

                container =
                    document.createElement(
                        "div"
                    );

                container.id =
                    "supplierToastContainer";

                container.className = `
                    fixed
                    top-5
                    right-5
                    z-[9999]
                    flex
                    flex-col
                    gap-2
                    w-[min(360px,calc(100vw-40px))]
                `;

                document.body.appendChild(
                    container
                );
            }


            const toast =
                document.createElement(
                    "div"
                );

            toast.className = `
                flex
                items-center
                gap-3
                rounded-lg
                border
                border-outline-variant
                dark:border-outline
                bg-white
                dark:bg-inverse-surface
                px-4
                py-3
                shadow-xl
            `;


            const icon =
                type === "success"
                    ? "check_circle"
                    : type === "error"
                    ? "error"
                    : "info";


            toast.innerHTML = `

                <span
                    class="material-symbols-outlined text-primary"
                >
                    ${icon}
                </span>

                <span class="text-sm flex-1">
                    ${escapeHtml(message)}
                </span>

                <button
                    type="button"
                    class="text-outline hover:text-on-surface"
                    aria-label="Close"
                >
                    <span class="material-symbols-outlined text-sm">
                        close
                    </span>
                </button>
            `;


            toast
                .querySelector("button")
                ?.addEventListener(
                    "click",
                    () => toast.remove()
                );


            container.appendChild(
                toast
            );


            setTimeout(
                () => toast.remove(),
                3500
            );
        }


        // =====================================================
        // INITIAL RENDER
        // =====================================================

        render();

    });

})();