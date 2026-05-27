package com.ecommerce.config;

import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DbInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public DbInitializer(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed default demo user if no users exist
        if (userRepository.count() == 0) {
            String defaultPassword = "password";
            String hashedPassword = PasswordHasher.hash(defaultPassword);
            User demoUser = new User("demo@example.com", hashedPassword, "Demo User");
            demoUser.setRole("ADMIN");
            userRepository.save(demoUser);
            
            // Seed standard testing user too
            User regularUser = new User("user@example.com", PasswordHasher.hash("password"), "Regular Tester");
            userRepository.save(regularUser);
        }

        // Seed products if catalog is empty
        if (productRepository.count() == 0) {
            productRepository.save(new Product(
                "Vortex Mechanical Keyboard",
                "A solid-aluminum gasket-mounted mechanical keyboard with premium linear switches, hot-swappable sockets, and vibrant per-key RGB backlighting.",
                new BigDecimal("189.99"),
                "Desk Setup",
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
                15,
                4.8
            ));

            productRepository.save(new Product(
                "SonicWave Pro ANC Earbuds",
                "Premium active noise cancelling wireless earbuds featuring high-fidelity sound, custom acoustic drivers, touch controls, and IPX5 sweat resistance.",
                new BigDecimal("149.99"),
                "Audio",
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
                25,
                4.6
            ));

            productRepository.save(new Product(
                "AuraLight RGB Ambient Bar",
                "Smart monitor light bar displaying brilliant colors and responsive backlighting. Features touch controls and customizable setup ambiance presets.",
                new BigDecimal("49.99"),
                "Desk Setup",
                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60",
                40,
                4.3
            ));

            productRepository.save(new Product(
                "ApexFit Smartwatch Ultra",
                "Rugged titanium sports smartwatch equipped with comprehensive bio-sensors, global GPS route tracking, and an exceptional 14-day battery run.",
                new BigDecimal("299.99"),
                "Wearables",
                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60",
                10,
                4.9
            ));

            productRepository.save(new Product(
                "ErgoDock Dual Monitor Arm",
                "Heavy-duty gas spring dual monitor mount accommodating two screens up to 32 inches. Perfect for flexible viewing ergonomics and zero clutter.",
                new BigDecimal("119.99"),
                "Desk Setup",
                "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop&q=60",
                20,
                4.5
            ));

            productRepository.save(new Product(
                "ZenFlow Ceramic Water Bottle",
                "Double-walled insulated ceramic flask designed to preserve the ideal drink temperature while avoiding metallic tastes. Modern style finish.",
                new BigDecimal("39.99"),
                "Lifestyle",
                "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
                30,
                4.4
            ));

            productRepository.save(new Product(
                "NovaShield Leather Desk Mat",
                "Eco-friendly executive desk blotter crafted from premium vegan leather. Designed to protect office workspaces with modern elegant tones.",
                new BigDecimal("59.99"),
                "Desk Setup",
                "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&auto=format&fit=crop&q=60",
                35,
                4.7
            ));

            productRepository.save(new Product(
                "TitanSound Portable Speaker",
                "Waterproof rugged outdoor Bluetooth speaker delivering deep thunderous bass, 360-degree stereo sound, and up to 24 hours of playback time.",
                new BigDecimal("89.99"),
                "Audio",
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
                18,
                4.6
            ));
        }
    }
}
