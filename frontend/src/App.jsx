import { Route, Routes } from 'react-router-dom'
import StoreLayout from './components/layout/StoreLayout'

// Public section
import Home from './sections/public/Home'
import NotFound from './sections/public/NotFound'

// Product browsing section
import Shop from './sections/shop/Shop'
import ProductDetail from './sections/shop/ProductDetail'

// Authentication section
import Login from './sections/auth/Login'
import Signup from './sections/auth/Signup'

// Cart section
import CartPage from './sections/cart/CartPage'

// Checkout / payment section
import Checkout from './sections/checkout/Checkout'
import OrderConfirmation from './sections/checkout/OrderConfirmation'

/**
 * Route map, grouped by application section.
 *
 * Authentication routes render outside the store chrome — they use their own
 * split-screen shell so the focus stays on the form.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmed" element={<OrderConfirmation />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}
