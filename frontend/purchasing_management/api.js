"use strict";

/*
 * StockMaster Purchasing API
 *
 * This file connects the existing Purchasing frontend
 * to the Django Purchasing API.
 */

window.StockMaster = window.StockMaster || {};

window.StockMaster.PurchasingAPI = {

    baseURL: "http://127.0.0.1:8000/api/purchasing/",


    async request(
        endpoint = "",
        options = {}
    ) {

        const response =
            await fetch(
                this.baseURL + endpoint,
                {
                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})
                    },

                    ...options
                }
            );


        if (
            response.redirected
        ) {

            throw new Error(
                "Django login is required before using Purchasing."
            );
        }


        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "Server returned an invalid response."
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Purchasing API request failed."
            );
        }


        return data;
    },


    async getPurchases() {

        return await this.request("");
    },


    async getOptions() {

        return await this.request(
            "options/"
        );
    },


    async getPurchase(
        purchaseId
    ) {

        return await this.request(
            `${purchaseId}/`
        );
    },


    async createPurchase(
        purchase
    ) {

        return await this.request(
            "create/",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        purchase
                    )
            }
        );
    },


    async receivePurchase(
        purchaseId,
        items
    ) {

        return await this.request(
            `${purchaseId}/receive/`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        items
                    })
            }
        );
    }

};