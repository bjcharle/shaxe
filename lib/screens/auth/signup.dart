import 'package:flutter/material.dart';
import 'package:shaxe/services/auth.dart';


class SignUp extends StatefulWidget {
  const SignUp({super.key});

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  final AuthService _authService = AuthService(); 
  String email = '';
  String password = '';
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.deepPurple,
        elevation: 8,
        title: const Text("Sign Up")
      ),
      body: Container(
        padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 50),
        child: Form(
          child: Column(
            children: [
              TextFormField(
                decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'email'),
              onChanged: (val) => setState((){
                email = val;
              }),
            ),
            TextFormField(
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'password'),
              onChanged: (val) => setState((){
                password = val;
              }),
            ),
            ElevatedButton(
              child: const Text('Sign Up'),
              onPressed: () async => {_authService.signup(email, password)}),
             ElevatedButton(
              child: const Text('Sign In'),
              onPressed: () async => {_authService.signin(email, password)})
           ],
              )),
      ),
    );
  }
}