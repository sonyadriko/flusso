import { NavLink } from 'react-router-dom';

const BottomNav = (): JSX.Element => {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                <span className="nav-icon">🏠</span>
                <span className="nav-label">Home</span>
            </NavLink>

            <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📋</span>
                <span className="nav-label">History</span>
            </NavLink>

            <NavLink to="/add" className="nav-add-btn">
                <span>+</span>
            </NavLink>

            <NavLink to="/wallets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">💳</span>
                <span className="nav-label">Wallets</span>
            </NavLink>

            <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📊</span>
                <span className="nav-label">Reports</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
