(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        const store =
            window.StockMaster?.SupplierStore;

        const form =
            document.getElementById(
                "supplierForm"
            );

        if (!store || !form) {

            console.error(
                "Supplier form or SupplierStore is missing."
            );

            return;
        }


        const params =
            new URLSearchParams(
                window.location.search
            );

        const supplierId =
            params.get("id");

        const editMode =
            Boolean(supplierId);


        const pageTitle =
            document.getElementById(
                "pageTitle"
            );

        const saveButton =
            document.getElementById(
                "saveButton"
            );

        const saveText =
            document.getElementById(
                "saveText"
            );

        const cancelButton =
            document.getElementById(
                "cancelButton"
            );


        // =====================================================
        // HELPERS
        // =====================================================

        function value(id) {

            return (
                document.getElementById(id)
                    ?.value
                    .trim()
            ) || "";
        }


        function setValue(
            id,
            data
        ) {

            const element =
                document.getElementById(id);

            if (element) {
                element.value =
                    data ?? "";
            }
        }


        // =====================================================
        // LOAD EDIT DATA
        // =====================================================

        if (editMode) {

            const supplier =
                store.getById(
                    supplierId
                );


            if (!supplier) {

                alert(
                    "Supplier not found."
                );

                window.location.href =
                    "suppliers_list.html";

                return;
            }


            if (pageTitle) {
                pageTitle.textContent =
                    "Edit Supplier";
            }

            if (saveText) {
                saveText.textContent =
                    "Save Changes";
            }


            setValue(
                "companyName",
                supplier.companyName
            );

            setValue(
                "supplierCode",
                supplier.code
            );

            setValue(
                "contactPerson",
                supplier.contactPerson
            );

            setValue(
                "phone",
                supplier.phone
            );

            setValue(
                "email",
                supplier.email
            );

            setValue(
                "website",
                supplier.website
            );

            setValue(
                "address",
                supplier.address
            );

            setValue(
                "city",
                supplier.city
            );

            setValue(
                "state",
                supplier.state
            );

            setValue(
                "postalCode",
                supplier.postalCode
            );

            setValue(
                "country",
                supplier.country
            );

            setValue(
                "taxNumber",
                supplier.taxNumber
            );

            setValue(
                "paymentTerms",
                supplier.paymentTerms
            );

            setValue(
                "status",
                supplier.status
            );

            setValue(
                "notes",
                supplier.notes
            );
        }


        // =====================================================
        // SUBMIT
        // =====================================================

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const companyName =
                    value("companyName");

                const contactPerson =
                    value("contactPerson");

                const phone =
                    value("phone");

                const email =
                    value("email");

                const country =
                    value("country");


                if (!companyName) {

                    alert(
                        "Company name is required."
                    );

                    document
                        .getElementById(
                            "companyName"
                        )
                        ?.focus();

                    return;
                }


                if (!contactPerson) {

                    alert(
                        "Contact person is required."
                    );

                    document
                        .getElementById(
                            "contactPerson"
                        )
                        ?.focus();

                    return;
                }


                if (!phone) {

                    alert(
                        "Phone number is required."
                    );

                    document
                        .getElementById(
                            "phone"
                        )
                        ?.focus();

                    return;
                }


                if (
                    email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        .test(email)
                ) {

                    alert(
                        "Please enter a valid email address."
                    );

                    return;
                }


                if (!country) {

                    alert(
                        "Country is required."
                    );

                    document
                        .getElementById(
                            "country"
                        )
                        ?.focus();

                    return;
                }


                const data = {

                    companyName,

                    code:
                        value("supplierCode"),

                    contactPerson,

                    phone,

                    email,

                    website:
                        value("website"),

                    address:
                        value("address"),

                    city:
                        value("city"),

                    state:
                        value("state"),

                    postalCode:
                        value("postalCode"),

                    country,

                    taxNumber:
                        value("taxNumber"),

                    paymentTerms:
                        value("paymentTerms"),

                    status:
                        value("status") ||
                        "Active",

                    notes:
                        value("notes")
                };


                saveButton.disabled =
                    true;


                try {

                    let supplier;


                    if (editMode) {

                        supplier =
                            store.update(
                                supplierId,
                                data
                            );

                    } else {

                        supplier =
                            store.create(
                                data
                            );
                    }


                    if (!supplier) {
                        throw new Error(
                            "Unable to save supplier."
                        );
                    }


                    alert(
                        editMode
                            ? "Supplier updated successfully."
                            : "Supplier created successfully."
                    );


                    window.location.href =
                        "suppliers_list.html";


                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Something went wrong while saving the supplier."
                    );

                    saveButton.disabled =
                        false;
                }
            }
        );


        // =====================================================
        // CANCEL
        // =====================================================

        cancelButton?.addEventListener(
            "click",
            () => {

                window.location.href =
                    editMode
                        ? `supplier_details.html?id=${encodeURIComponent(supplierId)}`
                        : "suppliers_list.html";
            }
        );

    });

})();