export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-5 py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-4"><h5>Air Collection</h5><p>Premium fashion for the modern world. Quality products at affordable prices.</p></div>
          <div className="col-md-2"><h5>Quick Links</h5><ul className="list-unstyled"><li><a href="/about" className="text-white text-decoration-none">About Us</a></li><li><a href="/contact" className="text-white text-decoration-none">Contact</a></li><li><a href="/categories" className="text-white text-decoration-none">Shop</a></li></ul></div>
          <div className="col-md-3"><h5>Customer Service</h5><ul className="list-unstyled"><li><a href="/orders" className="text-white text-decoration-none">My Orders</a></li><li><a href="/wishlist" className="text-white text-decoration-none">Wishlist</a></li><li><a href="/cart" className="text-white text-decoration-none">Cart</a></li></ul></div>
          <div className="col-md-3"><h5>Contact Info</h5><p>Email: support@aircollection.com</p><p>Phone: +1 234 567 890</p></div>
        </div>
        <hr className="bg-white" />
        <div className="text-center">&copy; {new Date().getFullYear()} Air Collection. All rights reserved.</div>
      </div>
    </footer>
  );
}