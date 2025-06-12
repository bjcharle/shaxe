import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import 'package:shaxe/models/user.dart';
import 'package:shaxe/screens/auth/signup.dart';
import 'package:shaxe/screens/main/home.dart';
import 'package:shaxe/screens/main/posts/add.dart';
import 'package:shaxe/screens/main/profile/profile.dart';

class Wrapper extends StatelessWidget {
  const Wrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<UserModel?>(context);

    if(user == null) {
      //show auth system routes
      return const SignUp(); 
    }
    
    //show main system routes
    return MaterialApp(
      initialRoute: '/',
      routes: {
        '/' : (context) => const Home(),
         '/add': (context) => const Add(),
        '/profile': (context) => const Profile()});
       }
    }