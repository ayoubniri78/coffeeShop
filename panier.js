function openDB() {
    const dbRequest = indexedDB.open("CoffeeShopDB", 1);

    dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("products")) {
            db.createObjectStore("products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cart")) {
            db.createObjectStore("cart", { keyPath: "id" });
        }
    };

    return dbRequest;
}

function updateTotalAmount(products) {
    const totalAmount = products.reduce((total, product) => total + product.price * product.quantity, 0);
    const totalAmountDiv = document.getElementById('total-amount');

    if (totalAmountDiv) {
        totalAmountDiv.textContent = `Montant total : ${totalAmount.toFixed(2)} DH`;
    } else {
        console.warn("Élément 'total-amount' introuvable.");
    }
}

function displayCartItems(products) {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) {
        console.warn("Élément 'cart-items' introuvable.");
        return;
    }

    cartContainer.innerHTML = ''; // Vider le contenu actuel

    products.forEach(product => {
        const productRow = createCartItemRow(product);
        cartContainer.appendChild(productRow);
    });

    // Mettre à jour le total
    updateTotalAmount(products);
}

function updateQuantity(itemId, newQuantity) {
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        const getRequest = store.get(itemId);

        getRequest.onsuccess = () => {
            const item = getRequest.result;

            if (item) {
                item.quantity = newQuantity;

                if (item.quantity > 0) {
                    store.put(item);
                    console.log("Quantité mise à jour :", item);
                } else {
                    store.delete(itemId);
                    console.log("Article supprimé car la quantité est 0.");
                }

                loadProductsFromCart();
            }
        };

        getRequest.onerror = () => {
            console.error("Erreur lors de la récupération de l'article.");
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}

function removeFromCart(itemId) {
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        const deleteRequest = store.delete(itemId);

        deleteRequest.onsuccess = () => {
            console.log(`Produit avec l'ID ${itemId} supprimé du panier.`);
            loadProductsFromCart();
        };

        deleteRequest.onerror = () => {
            console.error("Erreur lors de la suppression du produit.");
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}

function createCartItemRow(product) {
    const row = document.createElement('tr');

    const productCell = document.createElement('td');
    const img = document.createElement('img');
    img.src = product.image_url || '';
    img.alt = product.name || 'Produit';
    img.classList.add('cart-item-image');
    const name = document.createElement('span');
    name.textContent = product.name || 'Nom inconnu';
    productCell.appendChild(img);
    productCell.appendChild(name);

    const priceCell = document.createElement('td');
    priceCell.textContent = `${product.price?.toFixed(2) || '0.00'} DH`;

    const quantityCell = document.createElement('td');
    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-';
    decreaseBtn.onclick = () => updateQuantity(product.id, product.quantity - 1);

    const quantity = document.createElement('span');
    quantity.textContent = product.quantity || 0;

    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+';
    increaseBtn.onclick = () => updateQuantity(product.id, product.quantity + 1);

    quantityCell.appendChild(decreaseBtn);
    quantityCell.appendChild(quantity);
    quantityCell.appendChild(increaseBtn);

    const totalCell = document.createElement('td');
    const total = (product.price || 0) * (product.quantity || 0);
    totalCell.textContent = `${total.toFixed(2)} DH`;

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '×';
    deleteButton.classList.add('delete-button');
    deleteButton.onclick = () => removeFromCart(product.id);
    deleteCell.appendChild(deleteButton);
    row.appendChild(productCell);
    row.appendChild(priceCell);
    row.appendChild(quantityCell);
    row.appendChild(totalCell);
    row.appendChild(deleteCell);

    return row;
}

function loadProductsFromCart() {
    const dbRequest = openDB();

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;

        const transaction = db.transaction("cart", "readonly");
        const store = transaction.objectStore("cart");

        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const cartItems = getAllRequest.result;
            displayCartItems(cartItems);
        };

        getAllRequest.onerror = () => {
            console.error("Erreur lors du chargement des articles du panier.");
        };
    };

    dbRequest.onerror = () => {
        console.error("Erreur lors de l'ouverture de la base de données.");
    };
}

document.addEventListener('DOMContentLoaded', loadProductsFromCart);
