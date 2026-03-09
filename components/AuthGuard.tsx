"use client";

import React, { useState } from 'react';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
    onLoginSuccess: () => void;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ onLoginSuccess }) => {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Real implementation would verify credentials here.
        // For now, any submit logs the user in.
        onLoginSuccess();
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // Same for registration
        onLoginSuccess();
    };

    return (
        <div className={styles.bgContainer}>
            <div className={`${styles.container} ${isRightPanelActive ? styles.rightPanelActive : ''}`} id="container">

                {/* Register Form (Left side when overlay moves left) */}
                <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
                    <form className={styles.form} onSubmit={handleRegister}>
                        <h1 className={styles.title}>Register</h1>
                        <div className={styles.inputGroup}>
                            <input type="text" placeholder="Username" required className={styles.inputField} />
                            <svg className={styles.icon} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        <div className={styles.inputGroup}>
                            <input type="email" placeholder="Email" required className={styles.inputField} />
                            <svg className={styles.icon} viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                        </div>
                        <div className={styles.inputGroup}>
                            <input type="password" placeholder="Password" required className={styles.inputField} />
                            <svg className={styles.icon} viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                        </div>
                        <button type="submit" className={styles.btn}>Register</button>
                        <div className={styles.switchText}>
                            Already have an account? <button type="button" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
                        </div>
                    </form>
                </div>

                {/* Login Form (Right side when overlay moves right) */}
                <div className={`${styles.formContainer} ${styles.signInContainer}`}>
                    <form className={styles.form} onSubmit={handleLogin}>
                        <h1 className={styles.title}>Login</h1>
                        <div className={styles.inputGroup}>
                            <input type="text" placeholder="Username" required className={styles.inputField} />
                            <svg className={styles.icon} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        <div className={styles.inputGroup}>
                            <input type="password" placeholder="Password" required className={styles.inputField} />
                            <svg className={styles.icon} viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                        </div>
                        <button type="submit" className={styles.btn}>Login</button>
                        <div className={styles.switchText}>
                            Don't have an account? <button type="button" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
                        </div>
                    </form>
                </div>

                {/* Slicing Overlay Panel */}
                <div className={styles.overlayContainer}>
                    <div className={styles.overlayContent}>
                        {/* Shows when container moves left (Register) */}
                        <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
                            <h1 className={styles.title}>WELCOME!</h1>
                        </div>
                        {/* Shows when container is default right (Login) */}
                        <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
                            <h1 className={styles.title}>WELCOME<br />BACK!</h1>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthGuard;
