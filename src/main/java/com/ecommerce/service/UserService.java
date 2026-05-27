package com.ecommerce.service;

import com.ecommerce.config.PasswordHasher;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(String email, String password, String fullName) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered");
        }
        
        String hashedPassword = PasswordHasher.hash(password);
        User user = new User(email, hashedPassword, fullName);
        return userRepository.save(user);
    }

    public User getOrCreateFirebaseUser(String email, String firebaseUid, String fullName) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            String placeholderPassword = "FIREBASE_OAUTH_" + firebaseUid;
            String hashedPassword = PasswordHasher.hash(placeholderPassword);
            String name = (fullName != null && !fullName.trim().isEmpty()) ? fullName : "Ecommerce Customer";
            User user = new User(email, hashedPassword, name);
            return userRepository.save(user);
        });
    }

    public Optional<User> authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (PasswordHasher.check(password, user.getPasswordHash())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
