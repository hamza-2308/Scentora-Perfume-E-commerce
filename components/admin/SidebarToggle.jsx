'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function SidebarToggle() {
  const [open, setOpen] = useState(false);

  return (
    <button
      className="admin-sidebar-toggle"
      onClick={() => {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
        setOpen(!open);
      }}
      aria-label="Toggle sidebar"
    >
      {open ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}