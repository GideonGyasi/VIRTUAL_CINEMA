import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onAuthClick?: () => void;
}

const navItems = [
  { text: 'Home', to: '/home' },
  { text: 'Movies', to: '/home' },
  { text: 'Rooms', to: '/home' },
];

const Navbar: React.FC<NavbarProps> = ({ onAuthClick }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(3,7,18,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => setOpen(true)}
          sx={{ mr: 1, '&:hover': { transform: 'scale(1.1)', transition: '0.2s' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, mr: 1 }}>V</Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            Virtual Cinema
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 2,
            mx: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              px: 2,
              py: 0.5,
              borderRadius: 8,
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
              '&:hover': { background: 'rgba(255,255,255,0.08)' },
              transition: '0.2s',
            }}
          >
            <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', mr: 1 }} />
            <InputBase
              placeholder="Search movies..."
              sx={{ color: 'inherit', width: 200 }}
              inputProps={{ 'aria-label': 'search movies' }}
            />
          </Box>
        </Box>

        {/* Sign In Button */}
        <Button
          variant="contained"
          sx={{
            bgcolor: '#00bfa6',
            color: '#fff',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 2,
            '&:hover': { bgcolor: '#00d1b0', transform: 'scale(1.05)' },
            transition: '0.2s',
          }}
          onClick={() => (onAuthClick ? onAuthClick() : navigate('/login'))}
        >
          Sign in
        </Button>
      </Toolbar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            bgcolor: 'rgba(20,20,30,0.95)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }} role="presentation" onClick={() => setOpen(false)}>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.text}
                component={RouterLink}
                to={item.to}
                sx={{
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(0,191,166,0.1)' },
                }}
              >
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
