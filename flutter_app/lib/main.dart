import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/home_screen.dart';
import 'screens/prayer_screen.dart';
import 'screens/events_screen.dart';
import 'screens/login_screen.dart';

const String supabaseUrl    = 'https://cfcysdzgfeldlsgpsbfs.supabase.co';
const String supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmY3lzZHpnZmVsZGxzZ3BzYmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDAyMDgsImV4cCI6MjA5NjY3NjIwOH0'
    '.eh8ApZOzp8-CoXsFsBjnBB9PA_GUUpNiENUsv6t03Gk';

// ── Brand colours ─────────────────────────────────────────────────
const kBgColor      = Color(0xFF0A0A0A);   // near-black background
const kSurfaceColor = Color(0xFF1A1A1A);   // card surface
const kSurface2     = Color(0xFF242424);   // elevated card
const kTeal         = Color(0xFF1AAB8A);   // primary teal
const kTealDark     = Color(0xFF127A62);   // darker teal
const kAmber        = Color(0xFFF59E0B);   // accent amber
const kDivider      = Color(0xFF2C2C2C);   // subtle divider

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
  runApp(const ImasjidApp());
}

class ImasjidApp extends StatelessWidget {
  const ImasjidApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'i@masjid',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBgColor,
        colorScheme: const ColorScheme.dark(
          primary:   kTeal,
          secondary: kAmber,
          surface:   kSurfaceColor,
          onPrimary: Colors.black,
          onSurface: Colors.white,
        ),
        fontFamily: 'Outfit',
        appBarTheme: const AppBarTheme(
          backgroundColor: kBgColor,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        cardTheme: CardThemeData(
          color: kSurfaceColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: kDivider),
          ),
        ),
      ),
      home: const MainShell(),
    );
  }
}

// ── Bottom nav shell ─────────────────────────────────────────────
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;

  static const _screens = [
    HomeScreen(),
    PrayerScreen(),
    EventsScreen(),
    LoginScreen(),
  ];

  static const _items = [
    _NavItem(Icons.home_rounded,         Icons.home_outlined,        'Home'),
    _NavItem(Icons.access_time_rounded,  Icons.access_time_outlined, 'Prayer'),
    _NavItem(Icons.event_note_rounded,   Icons.event_note_outlined,  'Events'),
    _NavItem(Icons.person_rounded,       Icons.person_outline_rounded,'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: _BottomBar(
        items: _items,
        selectedIndex: _idx,
        onTap: (i) => setState(() => _idx = i),
      ),
    );
  }
}

class _NavItem {
  final IconData active, inactive;
  final String label;
  const _NavItem(this.active, this.inactive, this.label);
}

class _BottomBar extends StatelessWidget {
  final List<_NavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onTap;
  const _BottomBar({required this.items, required this.selectedIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        border: Border(top: BorderSide(color: kDivider, width: 0.5)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: List.generate(items.length, (i) {
              final selected = i == selectedIndex;
              final item = items[i];
              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        selected ? item.active : item.inactive,
                        size: 24,
                        color: selected ? kTeal : const Color(0xFF6B6B6B),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                          color: selected ? kTeal : const Color(0xFF6B6B6B),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
