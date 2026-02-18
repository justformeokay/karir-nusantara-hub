import { 
  Building2, 
  Users, 
  MessageSquare, 
  Bell, 
  CreditCard, 
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  UserPlus,
  Building,
  Wallet,
  Briefcase,
  Flag,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Companies', url: '/companies', icon: Building2 },
  { title: 'Job Seekers', url: '/job-seekers', icon: Users },
  { title: 'Job Management', url: '/jobs', icon: Briefcase },
  { title: 'Support', url: '/support', icon: MessageSquare },
  { title: 'Job Reports', url: '/job-reports', icon: Flag },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Billing', url: '/billing', icon: CreditCard },
];

const referralMenuItems = [
  { title: 'Partners', url: '/referral/partners', icon: UserPlus },
  { title: 'Companies', url: '/referral/companies', icon: Building },
  { title: 'Payouts', url: '/referral/payouts', icon: Wallet },
];

export function AppSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">KN</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground">Karir Nusantara</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">KN</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && 'sr-only')}>
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={cn(isCollapsed && 'sr-only')}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && 'sr-only')}>
            Referral & Affiliate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {referralMenuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink 
                        to={item.url} 
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className={cn(isCollapsed && 'sr-only')}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className={cn(isCollapsed && 'sr-only')}>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
