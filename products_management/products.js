(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const html = document.documentElement;

        // ================================
        // ELEMENTS
        // ================================

        const themeToggle = document.getElementById("theme-toggle");

        const tableSearch = document.getElementById("table-search");
        const categoryFilter = document.getElementById("categoryFilter");
        const statusFilter = document.getElementById("statusFilter");
        const resetFiltersButton =
            document.getElementById("resetFiltersButton");

        const productsTable =
            document.getElementById("products-table");

        const tableRows = Array.from(
            productsTable?.querySelectorAll("tbody .product-row") || []
        );

        const emptyState =
            document.getElementById("empty-state");

        const loadingState =
            document.getElementById("loading-state");

        const paginationFooter =
            document.getElementById("pagination-footer");

        const selectAllProducts =
            document.getElementById("selectAllProducts");

        const selectionToolbar =
            document.getElementById("selectionToolbar");

        const selectedCount =
            document.getElementById("selectedCount");

        const clearSelectionButton =
            document.getElementById("clearSelectionButton");

        const bulkArchiveButton =
            document.getElementById("bulkArchiveButton");

        const exportCsvButton =
            document.getElementById("exportCsvButton");

        const pagination =
            document.getElementById("pagination");

        const pageStatus =
            document.getElementById("pageStatus");

        const detailsModal =
            document.getElementById("details-modal");

        const modalContent =
            detailsModal?.querySelector(":scope > div");

        const modalSku =
            document.getElementById("modal-sku");

        const addProductUrl =
            "../add_edit_product/code.html";


        // ================================
        // SAFETY CHECK
        // ================================

        if (!productsTable || !tableSearch) {
            console.error(
                "Products page: required elements are missing."
            );

            return;
        }


        // ================================
        // THEME
        // ================================

        function applySavedTheme() {

            const savedTheme =
                localStorage.getItem("theme");

            if (
                savedTheme === "dark" ||
                (
                    !savedTheme &&
                    window.matchMedia(
                        "(prefers-color-scheme: dark)"
                    ).matches
                )
            ) {
                html.classList.add("dark");
            } else {
                html.classList.remove("dark");
            }
        }

        applySavedTheme();


        themeToggle?.addEventListener(
            "click",
            () => {

                const isDark =
                    html.classList.toggle("dark");

                localStorage.setItem(
                    "theme",
                    isDark ? "dark" : "light"
                );
            }
        );


        // ================================
        // ACCESSIBILITY STATUS
        // ================================

        function announce(message) {

            if (pageStatus) {
                pageStatus.textContent = message;
            }
        }


        // ================================
        // HELPER FUNCTIONS
        // ================================

        function normalize(value) {

            return String(value || "")
                .trim()
                .toLowerCase();
        }


        function getVisibleRows() {

            return tableRows.filter(
                row => !row.classList.contains("hidden")
            );
        }


        function getSelectedRows() {

            return tableRows.filter(row => {

                const checkbox =
                    row.querySelector(".product-select");

                return checkbox?.checked;
            });
        }


        function getProductData(row) {

            return {

                name:
                    row.dataset.productName ||
                    "Product",

                sku:
                    row.dataset.sku ||
                    "",

                category:
                    row.dataset.category ||
                    "",

                status:
                    row.dataset.status ||
                    ""
            };
        }


        // ================================
        // SELECTION
        // ================================

        function updateSelectionUI() {

            const selectedRows =
                getSelectedRows();

            const count =
                selectedRows.length;

            if (selectedCount) {
                selectedCount.textContent =
                    String(count);
            }


            if (count > 0) {

                selectionToolbar?.classList.remove(
                    "hidden"
                );

                selectionToolbar?.classList.add(
                    "flex"
                );

            } else {

                selectionToolbar?.classList.add(
                    "hidden"
                );

                selectionToolbar?.classList.remove(
                    "flex"
                );
            }


            const visibleRows =
                getVisibleRows();

            const selectedVisible =
                visibleRows.filter(row => {

                    return row.querySelector(
                        ".product-select"
                    )?.checked;

                }).length;


            if (selectAllProducts) {

                selectAllProducts.checked =
                    visibleRows.length > 0 &&
                    selectedVisible === visibleRows.length;

                selectAllProducts.indeterminate =
                    selectedVisible > 0 &&
                    selectedVisible < visibleRows.length;
            }
        }


        function clearSelection() {

            tableRows.forEach(row => {

                const checkbox =
                    row.querySelector(
                        ".product-select"
                    );

                if (checkbox) {
                    checkbox.checked = false;
                }
            });


            if (selectAllProducts) {

                selectAllProducts.checked =
                    false;

                selectAllProducts.indeterminate =
                    false;
            }


            updateSelectionUI();
        }


        // ================================
        // FILTERING
        // ================================

        function applyFilters() {

            const query =
                normalize(tableSearch.value);

            const category =
                normalize(categoryFilter?.value);

            const status =
                normalize(statusFilter?.value);


            let visibleCount = 0;


            tableRows.forEach(row => {

                const product =
                    getProductData(row);

                const rowText =
                    normalize(row.innerText);


                const matchesSearch =
                    !query ||
                    rowText.includes(query);


                const matchesCategory =
                    !category ||
                    product.category === category;


                const matchesStatus =
                    !status ||
                    product.status === status;


                const visible =
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus;


                row.classList.toggle(
                    "hidden",
                    !visible
                );


                if (visible) {
                    visibleCount++;
                }
            });


            const hasResults =
                visibleCount > 0;


            productsTable.classList.toggle(
                "hidden",
                !hasResults
            );


            paginationFooter?.classList.toggle(
                "hidden",
                !hasResults
            );


            if (emptyState) {

                emptyState.classList.toggle(
                    "hidden",
                    hasResults
                );

                emptyState.classList.toggle(
                    "flex",
                    !hasResults
                );
            }


            updateSelectionUI();


            announce(
                hasResults
                    ? `${visibleCount} product(s) displayed.`
                    : "No products match the selected filters."
            );
        }


        tableSearch.addEventListener(
            "input",
            applyFilters
        );


        categoryFilter?.addEventListener(
            "change",
            applyFilters
        );


        statusFilter?.addEventListener(
            "change",
            applyFilters
        );


        // ================================
        // CLEAR FILTERS
        // ================================

        function clearSearch() {

            tableSearch.value = "";


            if (categoryFilter) {
                categoryFilter.value = "";
            }


            if (statusFilter) {
                statusFilter.value = "";
            }


            tableRows.forEach(row => {

                row.classList.remove(
                    "hidden"
                );
            });


            productsTable.classList.remove(
                "hidden"
            );


            paginationFooter?.classList.remove(
                "hidden"
            );


            if (emptyState) {

                emptyState.classList.add(
                    "hidden"
                );

                emptyState.classList.remove(
                    "flex"
                );
            }


            clearSelection();


            announce(
                "All product filters cleared."
            );
        }


        // Make it available to existing HTML onclick.
        window.clearSearch =
            clearSearch;


        resetFiltersButton?.addEventListener(
            "click",
            clearSearch
        );


        // ================================
        // LOADING STATE
        // ================================

        function showLoadingPreview() {

            if (!loadingState) {
                applyFilters();
                return;
            }


            productsTable.classList.add(
                "hidden"
            );


            paginationFooter?.classList.add(
                "hidden"
            );


            emptyState?.classList.add(
                "hidden"
            );


            emptyState?.classList.remove(
                "flex"
            );


            loadingState.classList.remove(
                "hidden"
            );


            loadingState.classList.add(
                "flex"
            );


            window.setTimeout(() => {

                loadingState.classList.add(
                    "hidden"
                );

                loadingState.classList.remove(
                    "flex"
                );

                applyFilters();

            }, 250);
        }


        // ================================
        // PRODUCT SELECTION
        // ================================

        tableRows.forEach(row => {

            const checkbox =
                row.querySelector(
                    ".product-select"
                );


            checkbox?.addEventListener(
                "change",
                updateSelectionUI
            );


            row.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        ) ||
                        event.target.closest(
                            "input"
                        )
                    ) {
                        return;
                    }


                    const product =
                        getProductData(row);


                    showProductDetails(
                        product.sku
                    );
                }
            );
        });


        // Select all

        selectAllProducts?.addEventListener(
            "change",
            () => {

                const checked =
                    selectAllProducts.checked;


                getVisibleRows().forEach(row => {

                    const checkbox =
                        row.querySelector(
                            ".product-select"
                        );


                    if (checkbox) {
                        checkbox.checked =
                            checked;
                    }
                });


                updateSelectionUI();
            }
        );


        clearSelectionButton?.addEventListener(
            "click",
            clearSelection
        );


        // ================================
        // CONFIRMATION MODAL
        // ================================

        function showConfirmation({
            title,
            message,
            confirmText = "Confirm",
            danger = false,
            onConfirm
        }) {

            const existing =
                document.getElementById(
                    "product-confirm-modal"
                );


            existing?.remove();


            const modal =
                document.createElement(
                    "div"
                );


            modal.id =
                "product-confirm-modal";


            modal.className =
                "fixed inset-0 z-[200] " +
                "flex items-center justify-center " +
                "bg-on-surface/50 " +
                "backdrop-blur-sm p-md";


            modal.innerHTML = `

                <div
                    class="
                        w-full max-w-md
                        bg-surface-container-lowest
                        dark:bg-inverse-surface
                        rounded-2xl
                        shadow-2xl
                        border border-outline-variant
                        overflow-hidden
                    "
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                >

                    <div class="p-lg">

                        <div class="flex items-start gap-md">

                            <div
                                class="
                                    w-10 h-10
                                    rounded-full
                                    ${
                                        danger
                                            ? "bg-error/10 text-error"
                                            : "bg-primary/10 text-primary"
                                    }
                                    flex items-center justify-center
                                "
                            >

                                <span
                                    class="material-symbols-outlined"
                                >
                                    ${
                                        danger
                                            ? "warning"
                                            : "help"
                                    }
                                </span>

                            </div>


                            <div>

                                <h2
                                    id="confirm-title"
                                    class="
                                        font-headline-sm
                                        text-on-surface
                                        dark:text-surface
                                        font-bold
                                    "
                                >
                                    ${title}
                                </h2>


                                <p
                                    class="
                                        mt-xs
                                        text-body-sm
                                        text-on-surface-variant
                                    "
                                >
                                    ${message}
                                </p>

                            </div>

                        </div>

                    </div>


                    <div
                        class="
                            p-lg
                            bg-surface-container-low
                            dark:bg-on-surface-variant/10
                            flex justify-end gap-sm
                        "
                    >

                        <button
                            type="button"
                            data-action="cancel"
                            class="
                                px-md py-sm
                                rounded-lg
                                border border-outline-variant
                                text-on-surface
                                dark:text-surface
                                font-semibold
                                hover:bg-surface-container-high
                                transition-colors
                            "
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            data-action="confirm"
                            class="
                                px-md py-sm
                                rounded-lg
                                ${
                                    danger
                                        ? "bg-error text-white hover:bg-red-700"
                                        : "bg-primary text-on-primary hover:bg-primary/90"
                                }
                                font-semibold
                                transition-colors
                            "
                        >
                            ${confirmText}
                        </button>

                    </div>

                </div>
            `;


            document.body.appendChild(
                modal
            );


            const cancel =
                modal.querySelector(
                    '[data-action="cancel"]'
                );


            const confirm =
                modal.querySelector(
                    '[data-action="confirm"]'
                );


            const close =
                () => modal.remove();


            cancel.addEventListener(
                "click",
                close
            );


            confirm.addEventListener(
                "click",
                () => {

                    close();


                    if (
                        typeof onConfirm ===
                        "function"
                    ) {
                        onConfirm();
                    }
                }
            );


            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {
                        close();
                    }
                }
            );


            const escapeHandler =
                event => {

                    if (
                        event.key ===
                        "Escape"
                    ) {

                        close();

                        document.removeEventListener(
                            "keydown",
                            escapeHandler
                        );
                    }
                };


            document.addEventListener(
                "keydown",
                escapeHandler
            );


            confirm.focus();
        }


        // ================================
        // EDIT PRODUCT
        // ================================

        document
            .querySelectorAll(".edit-product")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const row =
                            button.closest(
                                ".product-row"
                            );


                        const product =
                            getProductData(row);


                        window.location.href =
                            `${addProductUrl}?mode=edit&sku=${encodeURIComponent(
                                product.sku
                            )}`;
                    }
                );
            });


        // ================================
        // ARCHIVE PRODUCT
        // ================================

        document
            .querySelectorAll(".delete-product")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const row =
                            button.closest(
                                ".product-row"
                            );


                        const product =
                            getProductData(row);


                        showConfirmation({

                            title:
                                "Archive product?",


                            message:
                                `"${product.name}" (${product.sku}) will be removed from the active product list. Historical transactions should remain preserved.`,


                            confirmText:
                                "Archive",


                            danger:
                                true,


                            onConfirm: () => {

                                row.remove();


                                const index =
                                    tableRows.indexOf(
                                        row
                                    );


                                if (
                                    index !== -1
                                ) {

                                    tableRows.splice(
                                        index,
                                        1
                                    );
                                }


                                applyFilters();


                                announce(
                                    `${product.name} has been archived in this frontend preview.`
                                );
                            }
                        });
                    }
                );
            });


        // ================================
        // BULK ARCHIVE
        // ================================

        bulkArchiveButton?.addEventListener(
            "click",
            () => {

                const selectedRows =
                    getSelectedRows();


                if (
                    !selectedRows.length
                ) {
                    return;
                }


                showConfirmation({

                    title:
                        "Archive selected products?",


                    message:
                        `${selectedRows.length} product(s) will be removed from the active product list.`,


                    confirmText:
                        "Archive Selected",


                    danger:
                        true,


                    onConfirm: () => {

                        selectedRows.forEach(
                            row => row.remove()
                        );


                        selectedRows.forEach(
                            row => {

                                const index =
                                    tableRows.indexOf(
                                        row
                                    );


                                if (
                                    index !== -1
                                ) {

                                    tableRows.splice(
                                        index,
                                        1
                                    );
                                }
                            }
                        );


                        clearSelection();

                        applyFilters();


                        announce(
                            `${selectedRows.length} product(s) archived in this frontend preview.`
                        );
                    }
                });
            }
        );

        // ================================
        // PRODUCT DETAILS MODAL
        // ================================

        function showProductDetails(sku) {

            if (
                !detailsModal ||
                !modalSku
            ) {
                return;
            }


            modalSku.textContent =
                `SKU: ${sku}`;


            detailsModal.classList.remove(
                "hidden"
            );


            detailsModal.classList.add(
                "flex"
            );


            window.requestAnimationFrame(
                () => {

                    detailsModal.classList.remove(
                        "opacity-0"
                    );


                    modalContent?.classList.remove(
                        "scale-95"
                    );
                }
            );
        }


        // Keep compatibility with your existing HTML.
        window.showProductDetails =
            showProductDetails;


        function closeDetailsModal() {

            if (!detailsModal) {
                return;
            }


            detailsModal.classList.add(
                "opacity-0"
            );


            modalContent?.classList.add(
                "scale-95"
            );


            window.setTimeout(
                () => {

                    detailsModal.classList.add(
                        "hidden"
                    );


                    detailsModal.classList.remove(
                        "flex"
                    );

                },
                200
            );
        }


        window.closeDetailsModal =
            closeDetailsModal;


        document
            .querySelectorAll(".view-labels")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const row =
                            button.closest(
                                ".product-row"
                            );


                        const product =
                            getProductData(row);


                        showProductDetails(
                            product.sku
                        );
                    }
                );
            });


        detailsModal?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    detailsModal
                ) {
                    closeDetailsModal();
                }
            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {
                    closeDetailsModal();
                }
            }
        );


        // ================================
        // CSV EXPORT
        // ================================

        exportCsvButton?.addEventListener(
            "click",
            () => {

                const visibleRows =
                    getVisibleRows();


                if (
                    !visibleRows.length
                ) {

                    announce(
                        "There are no visible products to export."
                    );

                    return;
                }


                const headers = [
                    "Product",
                    "SKU",
                    "Category",
                    "Status"
                ];


                const csvRows = [

                    headers,

                    ...visibleRows.map(
                        row => {

                            const product =
                                getProductData(
                                    row
                                );


                            return [
                                product.name,
                                product.sku,
                                product.category,
                                product.status
                            ];
                        }
                    )
                ];


                const csv =
                    csvRows
                        .map(
                            row =>
                                row
                                    .map(
                                        value =>
                                            `"${String(value)
                                                .replaceAll(
                                                    '"',
                                                    '""'
                                                )}"`
                                    )
                                    .join(",")
                        )
                        .join("\n");


                const blob =
                    new Blob(
                        [csv],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href = url;

                link.download =
                    "products.csv";


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );


                announce(
                    "Products exported as CSV."
                );
            }
        );


        // ================================
        // PAGINATION
        // ================================

        pagination?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (
                    !button ||
                    button.disabled
                ) {
                    return;
                }


                const page =
                    button.textContent.trim();


                if (
                    !/^\d+$/.test(page)
                ) {

                    announce(
                        "Pagination will be handled by Django when database data is connected."
                    );

                    return;
                }


                announce(
                    `Page ${page} selected in the frontend prototype. Server-side pagination will be connected in Django.`
                );
            }
        );


        // ================================
        // KEYBOARD SEARCH
        // ================================

        tableSearch.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {
                    clearSearch();
                }
            }
        );


        // ================================
        // INITIAL STATE
        // ================================

        updateSelectionUI();

        showLoadingPreview();

    });
})();