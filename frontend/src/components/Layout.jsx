import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton,
  Avatar, Menu, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, FolderSpecial, People,
  Assignment, CalendarToday, Receipt, Logout, Gavel, Description as DescriptionIcon,
  VerifiedUser
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';

const drawerWidth = 240;

// Define menu items with required permissions
const allMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', permission: null },
  { text: 'Cases', icon: <FolderSpecial />, path: '/cases', permission: 'case:view' },
  { text: 'Clients', icon: <People />, path: '/clients', permission: 'client:view' },
  { text: 'Tasks', icon: <Assignment />, path: '/tasks', permission: 'task:view' },
  { text: 'Calendar', icon: <CalendarToday />, path: '/calendar', permission: 'calendar:view' },
  { text: 'Billing', icon: <Receipt />, path: '/billing', permission: 'billing:view' },
  { text: 'Legal Data', icon: <Gavel />, path: '/legal-data', permission: 'legal_data:search' },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission, userRole } = useRole();

  // Filter menu items based on permissions and role
  let menuItems = allMenuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // For clients, show simplified navigation with separate pages
  if (userRole === 'client') {
    menuItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/client', permission: null },
      { text: 'My Cases', icon: <FolderSpecial />, path: '/client/cases', permission: 'case:view' },
      { text: 'My Documents', icon: <DescriptionIcon />, path: '/client/documents', permission: 'document:view' },
      { text: 'My Invoices', icon: <Receipt />, path: '/client/invoices', permission: 'billing:view' },
      { text: 'KYC Documents', icon: <VerifiedUser />, path: '/client/kyc', permission: 'document:upload' },
    ];
  }

  // For admins, show Users management
  if (userRole === 'admin') {
    menuItems.push({ text: 'Users', icon: <People />, path: '/users', permission: null });
    menuItems.push({ text: 'Reminders', icon: <Assignment />, path: '/settings/reminders', permission: null });
  }


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          LawyerMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={item.path ? location.pathname.startsWith(item.path.split('#')[0]) : false}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Lawyer Management System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name}</Typography>
            <IconButton onClick={handleMenuOpen}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

