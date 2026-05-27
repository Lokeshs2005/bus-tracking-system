package com.ecommerce.service;

import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CartItemRepository cartItemRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public Order placeOrder(User user, String shippingName, String shippingEmail, String shippingAddress, String shippingCity, String shippingZip) {
        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        if (cartItems == null || cartItems.isEmpty()) {
            throw new RuntimeException("Cannot place order. Your shopping cart is empty.");
        }

        // Calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            BigDecimal itemTotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        // Calculate tax (8%)
        BigDecimal taxRate = new BigDecimal("0.08");
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);

        // Calculate shipping (Free over $100, otherwise $9.99)
        BigDecimal shippingCost = subtotal.compareTo(new BigDecimal("100.00")) >= 0
                ? BigDecimal.ZERO
                : new BigDecimal("9.99");

        // Grand total
        BigDecimal grandTotal = subtotal.add(taxAmount).add(shippingCost).setScale(2, RoundingMode.HALF_UP);

        // Generate unique order number (e.g. ORD-123456)
        Random random = new Random();
        String orderNumber;
        do {
            orderNumber = "ORD-" + String.format("%06d", random.nextInt(1000000));
        } while (orderRepository.findByOrderNumber(orderNumber).isPresent());

        // Create Order record
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(orderNumber);
        order.setTotalAmount(grandTotal);
        order.setTaxAmount(taxAmount);
        order.setShippingCost(shippingCost);
        order.setShippingName(shippingName);
        order.setShippingEmail(shippingEmail);
        order.setShippingAddress(shippingAddress);
        order.setShippingCity(shippingCity);
        order.setShippingZip(shippingZip);
        order.setStatus("PLACED");
        order.setCreatedAt(LocalDateTime.now());

        // Save order to generate ID
        order = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        // Deduct inventory and create order items
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + " (Available: " + product.getStockQuantity() + ")");
            }

            // Deduct stock
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            // Create historic order item snapshot
            OrderItem orderItem = new OrderItem(order, product, cartItem.getQuantity(), product.getPrice());
            orderItemRepository.save(orderItem);
            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);

        // Clear user's shopping cart
        cartItemRepository.deleteByUser(user);

        return orderRepository.save(order);
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Order getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with number: " + orderNumber));
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));
        order.setStatus(status.toUpperCase());
        return orderRepository.save(order);
    }
}
