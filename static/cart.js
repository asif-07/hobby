document.addEventListener('DOMContentLoaded', () => {
  const cartList = document.getElementById('cart-list');
  const cartTotal = document.getElementById('cart-total');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    cartList.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id) || { name: 'Unknown', price: 0 };
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>Quantity: ${item.qty}</p>
      <p>Price: $${(product.price * item.qty).toFixed(2)}</p>
      <button data-id="${item.id}">Remove</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      removeFromCart(item.id);
    });
    cartList.appendChild(div);
  });

  updateTotal();

  function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      window.location.reload();
    }
  }

  function updateTotal() {
    const total = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id) || { price: 0 };
      return sum + product.price * item.qty;
    }, 0);
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
  }
});
