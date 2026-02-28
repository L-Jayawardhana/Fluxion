export default function Footer() {
    return (
        <footer>
            <div className="footer-top">
                <div className="footer-brand">
                    <a href="#" className="nav-logo">
                        <img src="/LOGOblack.png" alt="FLUXION" className="nav-logo-img footer-logo-img" />
                        FLUXION
                    </a>
                    <p className="footer-desc">Enterprise Asset &amp; Maintenance Management System. Built for organisations that take their physical assets seriously.</p>
                </div>
                <div>
                    <div className="footer-col-title">Product</div>
                    <ul className="footer-links">
                        <li><a href="#">Features</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Changelog</a></li>
                        <li><a href="#">Roadmap</a></li>
                    </ul>
                </div>
                <div>
                    <div className="footer-col-title">Company</div>
                    <ul className="footer-links">
                        <li><a href="#">About</a></li>
                        <li><a href="#">Blog</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <div className="footer-col-title">Legal</div>
                    <ul className="footer-links">
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                        <li><a href="#">Security</a></li>
                        <li><a href="#">Cookie Policy</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© 2025 FLUXION. All rights reserved.</span>
            </div>
        </footer>
    );
}
