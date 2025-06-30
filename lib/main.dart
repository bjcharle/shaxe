import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:shaxe/models/user.dart';
import 'package:shaxe/screens/wrapper.dart';
import 'package:shaxe/services/auth.dart';
import 'firebase_options.dart';
 
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
 
 final Future<FirebaseApp>_initialzation = Firebase.initializeApp();
 
  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future:_initialzation,
       builder: (context, snapshot) {
        //Check for errors
        if (snapshot.hasError) {
          //return SomthingWentWrong();
        } 
  
        if (snapshot.connectionState == ConnectionState.done) {
          return StreamProvider<UserModel?>.value(
            initialData: UserModel(
              uid: '',
              bannerImageUrl: '',
              profileImageUrl: '',
              userName: '',
              email: '',
            ),
            value: AuthService().user,
            child: const MaterialApp(home: Wrapper()),
            );
          }
  
        // Show while waiting for initialization
        return const Text('Loading');
      },  
    );
  }
}