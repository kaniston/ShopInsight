
let products = [];

// CHART INSTANCES
let categoryChartInstance = null;
let valueChartInstance = null;
let stockChartInstance = null;


// FORMAT CURRENCY IN INDIAN RUPEES
const formatINR = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });


// ESCAPE HTML TO PREVENT HTML INJECTION
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// RENDER DASHBOARD CARDS
function renderDashboard() {
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + product.stockQuantity,
        0
    );

    const salesValue = products.reduce(
        (sum, product) =>
            sum + product.sellingPrice * product.stockQuantity,
        0
    );

    const stockCost = products.reduce(
        (sum, product) =>
            sum + product.costPrice * product.stockQuantity,
        0
    );

    const profit = salesValue - stockCost;

    const lowStockCount = products.filter(
        product => product.stockQuantity <= product.minimumStock
    ).length;

    document.getElementById("totalProducts").textContent =
        totalProducts;

    document.getElementById("totalStock").textContent =
        totalStock;

    document.getElementById("stockValue").textContent =
        formatINR(salesValue);

    document.getElementById("totalStockCost").textContent =
        formatINR(stockCost);

    document.getElementById("potentialProfit").textContent =
        formatINR(profit);

    document.getElementById("lowStock").textContent =
        lowStockCount;

    renderProducts();

    // UPDATE ANALYTICS CHARTS
    renderCharts();
}


// DISPLAY AND SEARCH PRODUCTS
function renderProducts() {
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("productTable");
    const message = document.getElementById("message");

    const search = searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
    );

    table.innerHTML = filteredProducts.map(product => {
        let status = "In Stock";
        let className = "in-stock";

        if (product.stockQuantity === 0) {
            status = "Out of Stock";
            className = "out-stock";
        } else if (
            product.stockQuantity <= product.minimumStock
        ) {
            status = "Low Stock";
            className = "low-stock";
        }

        return `
            <tr>
                <td>${escapeHTML(product.id)}</td>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${formatINR(product.sellingPrice)}</td>
                <td>${product.stockQuantity}</td>
                <td>
                    <span class="badge ${className}">
                        ${status}
                    </span>
                </td>
                <td>
                    <button
                        class="edit-button"
                        data-id="${escapeHTML(product.id)}">
                        Edit
                    </button>

                    <button
                        class="delete-button"
                        data-id="${escapeHTML(product.id)}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    message.textContent =
        `${filteredProducts.length} product(s) displayed.`;
}


// ========================================
// RETAIL ANALYTICS CHARTS
// ========================================
function renderCharts() {

    // Check Chart.js
    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js is not loaded. Check your internet connection."
        );
        return;
    }

    const categoryCanvas =
        document.getElementById("categoryChart");

    const valueCanvas =
        document.getElementById("valueChart");

    const stockCanvas =
        document.getElementById("stockChart");

    if (!categoryCanvas || !valueCanvas || !stockCanvas) {
        console.error("Analytics chart elements were not found.");
        return;
    }

    // Destroy old charts before redrawing
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (valueChartInstance) {
        valueChartInstance.destroy();
    }

    if (stockChartInstance) {
        stockChartInstance.destroy();
    }


    // ----------------------------------------
    // CHART 1: STOCK BY CATEGORY
    // ----------------------------------------
    const categoryData = {};

    products.forEach(product => {
        const category = product.category || "Uncategorized";

        categoryData[category] =
            (categoryData[category] || 0) +
            Number(product.stockQuantity || 0);
    });

    categoryChartInstance = new Chart(categoryCanvas, {
        type: "bar",

        data: {
            labels: Object.keys(categoryData),

            datasets: [{
                label: "Stock Quantity",
                data: Object.values(categoryData),
                backgroundColor: "#ea580c",
                borderRadius: 6
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });


    // ----------------------------------------
    // CHART 2: COST VS SELLING VALUE
    // ----------------------------------------
    let totalCost = 0;
    let totalSellingValue = 0;

    products.forEach(product => {
        const quantity = Number(product.stockQuantity || 0);

        totalCost +=
            Number(product.costPrice || 0) * quantity;

        totalSellingValue +=
            Number(product.sellingPrice || 0) * quantity;
    });

    valueChartInstance = new Chart(valueCanvas, {
        type: "bar",

        data: {
            labels: ["Current Inventory"],

            datasets: [
                {
                    label: "Stock Cost (₹)",
                    data: [totalCost],
                    backgroundColor: "#f59e0b",
                    borderRadius: 5
                },
                {
                    label: "Potential Sales Value (₹)",
                    data: [totalSellingValue],
                    backgroundColor: "#dc2626",
                    borderRadius: 5
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": " +
                                formatINR(context.raw);
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function(value) {
                            return "₹" +
                                Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });


    // ----------------------------------------
    // CHART 3: STOCK STATUS DISTRIBUTION
    // ----------------------------------------
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach(product => {
        const quantity = Number(product.stockQuantity || 0);
        const minimum = Number(product.minimumStock || 0);

        if (quantity <= 0) {
            outOfStock++;
        } else if (quantity <= minimum) {
            lowStock++;
        } else {
            inStock++;
        }
    });

    stockChartInstance = new Chart(stockCanvas, {
        type: "doughnut",

        data: {
            labels: [
                "In Stock",
                "Low Stock",
                "Out of Stock"
            ],

            datasets: [{
                data: [
                    inStock,
                    lowStock,
                    outOfStock
                ],

                backgroundColor: [
                    "#ea580c",
                    "#f59e0b",
                    "#dc2626"
                ],

                borderWidth: 2
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// OPEN ADD PRODUCT FORM
document.getElementById("addButton").addEventListener("click", () => {
    const section = document.getElementById("addProductSection");

    section.hidden = false;

    document.getElementById("formMessage").textContent = "";

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// CLOSE ADD PRODUCT FORM
document.getElementById("cancelButton").addEventListener("click", () => {
    document.getElementById("addProductSection").hidden = true;

    document.getElementById("productForm").reset();

    document.getElementById("formMessage").textContent = "";
});


// SAVE NEW PRODUCT TO SUPABASE
document.getElementById("productForm").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const form = document.getElementById("productForm");
        const formMessage = document.getElementById("formMessage");
        const saveButton = document.getElementById("saveProductButton");

        const name =
            document.getElementById("productName").value.trim();

        const category =
            document.getElementById("productCategory").value.trim();

        const costPrice =
            Number(document.getElementById("costPrice").value);

        const sellingPrice =
            Number(document.getElementById("sellingPrice").value);

        const stock =
            Number(document.getElementById("stockQuantity").value);

        const minimumStock =
            Number(document.getElementById("minimumStock").value);

        const requiredFields = [
            "costPrice",
            "sellingPrice",
            "stockQuantity",
            "minimumStock"
        ];

        if (
            !name ||
            !category ||
            requiredFields.some(
                id => document.getElementById(id).value.trim() === ""
            )
        ) {
            formMessage.textContent = "Please fill in all fields.";
            return;
        }

        if (
            !Number.isFinite(costPrice) ||
            !Number.isFinite(sellingPrice) ||
            !Number.isInteger(stock) ||
            !Number.isInteger(minimumStock) ||
            costPrice < 0 ||
            sellingPrice < 0 ||
            stock < 0 ||
            minimumStock < 0
        ) {
            formMessage.textContent =
                "Enter valid prices and non-negative whole numbers for stock.";
            return;
        }

        if (sellingPrice < costPrice) {
            formMessage.textContent =
                "Selling price should not be less than cost price.";
            return;
        }

        saveButton.disabled = true;
        formMessage.textContent = "Saving product...";

        try {
            const {
                data: { user },
                error: authError
            } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                window.location.replace("login.html");
                return;
            }

            const { error } = await supabaseClient
                .from("products")
                .insert({
                    name: name,
                    category: category,
                    cost_price: costPrice,
                    selling_price: sellingPrice,
                    stock_quantity: stock,
                    minimum_stock: minimumStock,
                    is_active: true,
                    user_id: user.id
                });

            if (error) {
                console.error("Save product error:", error);

                formMessage.textContent =
                    "Unable to save product: " + error.message;

                return;
            }

            form.reset();

            document.getElementById("addProductSection").hidden = true;

            formMessage.textContent = "";

            await loadProducts();

            document.getElementById("message").textContent =
                "Product added successfully!";

        } catch (error) {
            console.error("Unexpected save error:", error);

            formMessage.textContent =
                "Something went wrong. Please try again.";

        } finally {
            saveButton.disabled = false;
        }
    }
);


// LOAD PRODUCTS FROM SUPABASE
async function loadProducts() {
    const message = document.getElementById("message");

    try {
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            window.location.replace("login.html");
            return;
        }

        const { data, error } = await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                category,
                cost_price,
                selling_price,
                stock_quantity,
                minimum_stock,
                is_active
            `)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("id", { ascending: true });

        if (error) {
            console.error("Product loading error:", error);

            message.textContent =
                "Unable to load products: " + error.message;

            return;
        }

        products = (data || []).map(product => ({
            id: product.id,
            name: String(product.name ?? ""),
            category: String(product.category ?? ""),
            costPrice: Number(product.cost_price ?? 0),
            sellingPrice: Number(product.selling_price ?? 0),
            stockQuantity: Number(product.stock_quantity ?? 0),
            minimumStock: Number(product.minimum_stock ?? 0),
            isActive: product.is_active
        }));

        console.log("Products received from Supabase:", data);
        console.log("Mapped products:", products);
        console.log("Number of products:", products.length);

        renderDashboard();
        populateSalesProducts();


    } catch (error) {
        console.error("Unexpected loading error:", error);

        message.textContent =
            "An unexpected error occurred while loading products.";
    }
}


// SEARCH PRODUCTS AS THE USER TYPES
document.getElementById("searchInput").addEventListener(
    "input",
    renderProducts
);


// INITIALIZE DASHBOARD
loadProducts();


// LOGOUT
document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            alert("Logout failed: " + error.message);
            return;
        }

        window.location.replace("login.html");
    }
);


// ========================================
// EDIT AND DELETE PRODUCT FUNCTIONALITY
// ========================================

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editProductForm");
const editMessage = document.getElementById("editMessage");
const updateButton = document.getElementById("updateProductButton");

let editingProductId = null;


// OPEN EDIT POPUP OR DELETE PRODUCT
document.getElementById("productTable").addEventListener(
    "click",
    async (event) => {
        const editButton = event.target.closest(".edit-button");
        const deleteButton = event.target.closest(".delete-button");

        if (!editButton && !deleteButton) return;

        const button = editButton || deleteButton;

        const product = products.find(
            item => String(item.id) === button.dataset.id
        );

        if (!product) {
            alert("Product not found. Please refresh the dashboard.");
            return;
        }

        // OPEN EDIT POPUP
        if (editButton) {
            editingProductId = product.id;

            document.getElementById("editName").value = product.name;
            document.getElementById("editCategory").value = product.category;
            document.getElementById("editCostPrice").value = product.costPrice;
            document.getElementById("editSellingPrice").value = product.sellingPrice;
            document.getElementById("editStock").value = product.stockQuantity;
            document.getElementById("editMinimumStock").value = product.minimumStock;

            editMessage.textContent = "";
            editModal.hidden = false;

            return;
        }

        // DELETE PRODUCT AFTER CONFIRMATION
        if (deleteButton) {
            if (!confirm(`Delete "${product.name}" permanently?`)) {
                return;
            }

            deleteButton.disabled = true;

            try {
                const {
                    data: { user },
                    error: authError
                } = await supabaseClient.auth.getUser();

                if (authError || !user) {
                    window.location.replace("login.html");
                    return;
                }

                const { error } = await supabaseClient
                    .from("products")
                    .delete()
                    .eq("id", product.id)
                    .eq("user_id", user.id);

                if (error) throw error;

                await loadProducts();

                document.getElementById("message").textContent =
                    "Product deleted successfully.";

            } catch (error) {
                console.error("Delete error:", error);

                alert("Could not delete product: " + error.message);

            } finally {
                deleteButton.disabled = false;
            }
        }
    }
);


// SAVE EDITED PRODUCT
editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name =
        document.getElementById("editName").value.trim();

    const category =
        document.getElementById("editCategory").value.trim();

    const costPrice =
        Number(document.getElementById("editCostPrice").value);

    const sellingPrice =
        Number(document.getElementById("editSellingPrice").value);

    const stock =
        Number(document.getElementById("editStock").value);

    const minimumStock =
        Number(document.getElementById("editMinimumStock").value);

    if (
        !name ||
        !category ||
        !Number.isFinite(costPrice) ||
        !Number.isFinite(sellingPrice) ||
        !Number.isInteger(stock) ||
        !Number.isInteger(minimumStock) ||
        costPrice < 0 ||
        sellingPrice < costPrice ||
        stock < 0 ||
        minimumStock < 0
    ) {
        editMessage.textContent =
            "Enter valid product details. Selling price must be at least the cost price.";

        return;
    }

    updateButton.disabled = true;
    editMessage.textContent = "Updating product...";

    try {
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            window.location.replace("login.html");
            return;
        }

        const { data, error } = await supabaseClient
            .from("products")
            .update({
                name,
                category,
                cost_price: costPrice,
                selling_price: sellingPrice,
                stock_quantity: stock,
                minimum_stock: minimumStock
            })
            .eq("id", editingProductId)
            .eq("user_id", user.id)
            .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error(
                "No product was updated. Check ownership and permissions."
            );
        }

        editModal.hidden = true;

        await loadProducts();

        document.getElementById("message").textContent =
            "Product updated successfully.";

    } catch (error) {
        console.error("Update error:", error);

        editMessage.textContent =
            "Update failed: " + error.message;

    } finally {
        updateButton.disabled = false;
    }
});


// CLOSE EDIT POPUP
document.getElementById("closeEditButton").addEventListener(
    "click",
    () => {
        editModal.hidden = true;
        editForm.reset();
    }
);


// CLOSE POPUP WHEN CLICKING OUTSIDE
editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
        editModal.hidden = true;
        editForm.reset();
    }
});

// ========================================
// EXPORT INVENTORY TO CSV
// ========================================

const exportButton = document.getElementById("exportButton");

if (exportButton) {
    exportButton.addEventListener("click", exportInventoryToCSV);
}

function exportInventoryToCSV() {
    if (!products || products.length === 0) {
        alert("No products available to export!");
        return;
    }

    const headers = [
        "Product ID",
        "Product Name",
        "Category",
        "Cost Price (INR)",
        "Selling Price (INR)",
        "Stock Quantity",
        "Minimum Stock",
        "Total Stock Cost (INR)",
        "Potential Sales Value (INR)",
        "Potential Gross Profit (INR)",
        "Stock Status"
    ];

    const rows = products.map(product => {
        const quantity = Number(product.stockQuantity) || 0;
        const cost = Number(product.costPrice) || 0;
        const selling = Number(product.sellingPrice) || 0;
        const minimum = Number(product.minimumStock) || 0;

        let status;

        if (quantity <= 0) {
            status = "Out of Stock";
        } else if (quantity <= minimum) {
            status = "Low Stock";
        } else {
            status = "In Stock";
        }

        return [
            product.id,
            product.name,
            product.category,
            cost.toFixed(2),
            selling.toFixed(2),
            quantity,
            minimum,
            (cost * quantity).toFixed(2),
            (selling * quantity).toFixed(2),
            ((selling - cost) * quantity).toFixed(2),
            status
        ];
    });

    // Escape CSV values safely
    function escapeCSV(value) {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection in text fields
        if (/^[\s]*[=+\-@\t\r]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    // BOM helps Excel display text correctly
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ShopInsight_Inventory.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    alert("Inventory exported successfully!");
}
// ========================================
// SHOPINSIGHT SALES MANAGEMENT
// ========================================

const saleProduct = document.getElementById("saleProduct");
const saleQuantity = document.getElementById("saleQuantity");
const salePrice = document.getElementById("salePrice");
const salesForm = document.getElementById("salesForm");
const salesMessage = document.getElementById("salesMessage");
const salesTable = document.getElementById("salesTable");
const recordSaleButton = document.getElementById("recordSaleButton");

// Fill the product dropdown from the current inventory
function populateSalesProducts() {
    if (!saleProduct) return;

    const previousValue = saleProduct.value;

    saleProduct.innerHTML =
        '<option value="">Choose a product</option>';

    products.forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent =
            `${product.name} — Stock: ${product.stockQuantity}`;

        option.dataset.price = product.sellingPrice;
        option.dataset.stock = product.stockQuantity;

        saleProduct.appendChild(option);
    });

    // Preserve the selection when possible
    if (
        previousValue &&
        [...saleProduct.options].some(
            option => option.value === previousValue
        )
    ) {
        saleProduct.value = previousValue;
    }

    updateSelectedSaleProduct();
}

// Update the selling price and available stock
function updateSelectedSaleProduct() {
    const option = saleProduct?.selectedOptions[0];

    const availableStock =
        document.getElementById("availableStock");

    if (!option || !option.value) {
        if (availableStock) availableStock.textContent = "";
        if (salePrice) salePrice.value = "";
        return;
    }

    salePrice.value = option.dataset.price;

    if (availableStock) {
        availableStock.textContent =
            `Available stock: ${option.dataset.stock}`;
    }
}

saleProduct?.addEventListener(
    "change",
    updateSelectedSaleProduct
);

// Record a sale using the secure PostgreSQL function
salesForm?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const productId = Number(saleProduct.value);
    const quantity = Number(saleQuantity.value);
    const price = Number(salePrice.value);

    if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        salesMessage.textContent =
            "Please enter valid sale details.";
        return;
    }

    const selectedProduct = products.find(
        product => Number(product.id) === productId
    );

    if (!selectedProduct) {
        salesMessage.textContent =
            "Please select a valid product.";
        return;
    }

    if (quantity > Number(selectedProduct.stockQuantity)) {
        salesMessage.textContent =
            `Insufficient stock. Available: ${selectedProduct.stockQuantity}`;
        return;
    }

    recordSaleButton.disabled = true;
    salesMessage.textContent = "Recording sale...";

    try {
        const {
            data,
            error
        } = await supabaseClient.rpc("record_sale", {
            p_product_id: productId,
            p_quantity: quantity,
            p_unit_price: price
        });

        if (error) throw error;

        if (!data || data.success !== true) {
            throw new Error("The sale could not be confirmed.");
        }

        salesMessage.textContent =
            `Sale recorded! Revenue: ${formatINR(data.total_amount)}. ` +
            `Gross profit: ${formatINR(data.gross_profit)}. ` +
            `Remaining stock: ${data.remaining_stock}.`;

        salesMessage.style.color = "#c2410c";

        salesForm.reset();

        // Refresh inventory, dashboard and charts
        await loadProducts();

        // Refresh transaction history
        await loadSalesHistory();

    } catch (error) {
        console.error("Sales error:", error);

        salesMessage.textContent =
            error.message || "Unable to record the sale.";

        salesMessage.style.color = "#dc2626";

    } finally {
        recordSaleButton.disabled = false;
    }
});

// Load the logged-in user's sales history
async function loadSalesHistory() {
    if (!salesTable) return;

    salesTable.innerHTML =
        '<tr><td colspan="7">Loading sales...</td></tr>';

    const historyMessage =
        document.getElementById("salesHistoryMessage");

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("sales")
            .select(
                "id, product_name, quantity, unit_price, " +
                "total_amount, gross_profit, sold_at"
            )
            .order("sold_at", { ascending: false })
            .limit(100);

        if (error) throw error;

        if (!data || data.length === 0) {
            salesTable.innerHTML =
                '<tr><td colspan="7">No sales recorded yet.</td></tr>';

            return;
        }

        salesTable.innerHTML = data.map(sale => `
            <tr>
                <td>${escapeHTML(sale.id)}</td>
                <td>${escapeHTML(sale.product_name)}</td>
                <td>${escapeHTML(sale.quantity)}</td>
                <td>${formatINR(sale.unit_price)}</td>
                <td>${formatINR(sale.total_amount)}</td>
                <td>${formatINR(sale.gross_profit)}</td>
                <td>${escapeHTML(
                    new Date(sale.sold_at).toLocaleString("en-IN")
                )}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Sales history error:", error);

        salesTable.innerHTML = "";

        if (historyMessage) {
            historyMessage.textContent =
                "Unable to load sales history. Please check the database permissions.";
        }
    }
}

// Load sales history when the dashboard starts
loadSalesHistory();