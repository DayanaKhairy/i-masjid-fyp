// lib/screens/login_screen.dart

import 'dart:async';
import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../models/event.dart';
import 'signup_screen.dart';
import '../main.dart' show kBgColor, kSurfaceColor, kTeal, kAmber, kDivider;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _loading = false;
  bool _profileLoading = false;

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  Map<String, dynamic>? _currentUser;
  List<Event> _registeredEvents = [];
  StreamSubscription<bool>? _authSub;

  @override
  void initState() {
    super.initState();
    _currentUser = SupabaseService.currentUser;
    if (_currentUser != null) {
      _loadProfileAndEvents();
    }
    _authSub = SupabaseService.authStateChanges.listen((isLoggedIn) {
      if (!mounted) return;
      setState(() {
        _currentUser = SupabaseService.currentUser;
      });
      if (isLoggedIn) {
        _loadProfileAndEvents();
      } else {
        setState(() {
          _registeredEvents = [];
        });
      }
    });
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileAndEvents() async {
    final user = _currentUser;
    if (user == null) return;
    setState(() => _profileLoading = true);

    final email = user['email'] as String;
    final allEvents = await SupabaseService.getEvents();
    final regs = await SupabaseService.getUserRegistrations(email);

    if (!mounted) return;
    setState(() {
      _registeredEvents = allEvents.where((e) => regs.contains(e.id)).toList();
      _profileLoading = false;
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final ok = await SupabaseService.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ok ? 'Logged in successfully! Welcome back.' : 'Invalid email or password. ⚠️')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An unexpected error occurred: $e ⚠️')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSignOut() async {
    setState(() => _loading = true);
    try {
      await SupabaseService.signOut();
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _currentUser = null;
          _registeredEvents = [];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(_currentUser == null ? 'Member Login' : 'My Account'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _currentUser == null
              ? _buildLoginForm(scheme)
              : _buildProfileView(scheme),
    );
  }

  Widget _buildLoginForm(ColorScheme scheme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            const Center(
              child: Text('Welcome Back', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Log in to view and register for mosque events',
                style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.5), fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            // Email
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: _inputDecoration('Email Address', Icons.email_outlined),
              validator: (val) => val == null || !val.contains('@') ? 'Enter a valid email' : null,
            ),
            const SizedBox(height: 16),
            // Password
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              decoration: _inputDecoration('Password', Icons.lock_outline),
              validator: (val) => val == null || val.length < 6 ? 'Password must be at least 6 characters' : null,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleLogin,
              child: const Text('Log In'),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SignupScreen())),
              child: Text("Don't have an account? Sign Up", style: TextStyle(color: scheme.primary)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileView(ColorScheme scheme) {
    if (_profileLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    final email = _currentUser?['email'] ?? '';
    final firstName = _currentUser?['first_name'] ?? 'Mosque';
    final lastName = _currentUser?['last_name'] ?? 'Member';
    final phone = _currentUser?['phone_number'] ?? 'Not provided';
    final id = _currentUser?['id']?.toString() ?? '';
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Profile Summary Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E3F30)),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: scheme.primary.withValues(alpha: 0.15),
                  child: Text(
                    firstName[0].toUpperCase() + (lastName.isNotEmpty ? lastName[0].toUpperCase() : ''),
                    style: TextStyle(color: scheme.primary, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text('$firstName $lastName', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  decoration: BoxDecoration(
                    color: scheme.secondary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(50),
                    border: Border.all(color: scheme.secondary.withValues(alpha: 0.4)),
                  ),
                  child: Text('MEMBER #${id}', style: TextStyle(color: scheme.secondary, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 20),
                _profileItem(Icons.email_outlined, 'Email', email),
                _profileItem(Icons.phone_outlined, 'Phone', phone),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Registered Events Section
          const Text('My Event Registrations 📅', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (_registeredEvents.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: const Color(0xFF0D2018), borderRadius: BorderRadius.circular(12)),
              child: const Center(child: Text("You haven't registered for any events yet.", style: TextStyle(color: Colors.white60, fontSize: 13), textAlign: TextAlign.center)),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _registeredEvents.length,
              itemBuilder: (context, index) {
                final ev = _registeredEvents[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: Text(ev.iconEmoji, style: const TextStyle(fontSize: 22)),
                    title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('${ev.formattedDate} • ${ev.timeRange}'),
                    trailing: const Icon(Icons.check_circle_outline, color: Colors.green),
                  ),
                );
              },
            ),
          const SizedBox(height: 32),
          // Sign Out Button
          OutlinedButton.icon(
            onPressed: _handleSignOut,
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            label: const Text('Log Out', style: TextStyle(color: Colors.redAccent)),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent), padding: const EdgeInsets.symmetric(vertical: 14)),
          ),
        ],
      ),
    );
  }

  Widget _profileItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.white54),
          const SizedBox(width: 12),
          Text('$label: ', style: const TextStyle(color: Colors.white54, fontSize: 13)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.white38),
      labelStyle: const TextStyle(color: Colors.white38),
      filled: true,
      fillColor: const Color(0xFF122C20),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E3F30))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF10B981))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E3F30))),
    );
  }
}
