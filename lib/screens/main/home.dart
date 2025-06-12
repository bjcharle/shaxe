import 'package:flutter/material.dart';
import 'package:shaxe/services/auth.dart';

class Home extends StatelessWidget {
  const Home ({super.key});

  @override
  Widget build(BuildContext context) {
    final AuthService _authService = AuthService();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        backgroundColor: Colors.deepPurple,
    ), 
    floatingActionButton: FloatingActionButton(
      onPressed: () {Navigator.pushNamed(context, '/add');
      }, 
      child: const Icon(Icons.add)),
      drawer: Drawer(
        child: ListView(
          children: <Widget>[
            const DrawerHeader(child: Text('drawer header'),
            decoration: BoxDecoration(color: Colors.purpleAccent)
            ),
            ListTile(
              title: const Text('Profile'),
              onTap: () {
              Navigator.pushNamed(context, '/profile');
            },
            ),
            ListTile(
              title: const Text('LogOut'),
              onTap: () async {
                _authService.signout();
            },
          ),
        ],
      ),
    ),
    );
  }}