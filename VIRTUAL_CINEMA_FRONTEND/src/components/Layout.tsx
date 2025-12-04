import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import MovieIcon from '@mui/icons-material/Movie';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const drawerWidth = 260;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const items = [
    { text: 'Home', icon: <HomeIcon />, to: '/home' },
    { text: 'Movies', icon: <MovieIcon />, to: '/home' },
    { text: 'Rooms', icon: <GroupIcon />, to: '/home' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Glassmorphic AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(25,25,35,0.85)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(!open)}
            aria-label="menu"
            sx={{ mr: 2, '&:hover': { transform: 'scale(1.1)', transition: '0.2s' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Virtual Cinema
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Animated Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: drawerWidth,
            bgcolor: 'rgba(20,20,30,0.95)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <Toolbar />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {items.map((it) => (
              <motion.div
                key={it.text}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <ListItem
                  button
                  onClick={() => {
                    navigate(it.to);
                    setOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    '&:hover': { bgcolor: 'rgba(0,191,166,0.1)' },
                  }}
                >
                  <ListItemIcon sx={{ color: '#00bfa6' }}>{it.icon}</ListItemIcon>
                  <ListItemText primary={it.text} />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 9, minHeight: '100vh', bgcolor: 'rgba(15,15,25,0.8)' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
