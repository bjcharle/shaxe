import 'package:firebase_auth/firebase_auth.dart';
import 'package:shaxe/models/user.dart';

class AuthService{
  FirebaseAuth auth = FirebaseAuth.instance;


  
 UserModel? _userFromFirebaseUser(User? user){
  return user != null
      ? UserModel(
          uid: user.uid,
          userName: user.displayName ?? '',
          email: user.email ?? '',
          profileImageUrl: user.photoURL ?? '',
          bannerImageUrl: '', // Provide a default or fetch from elsewhere
        )
      : null;
 }
 
Stream<UserModel?> get user{
  return auth.authStateChanges().map(_userFromFirebaseUser);
}

 Future signup(email, password) async {
    try {
      User user = (await auth.createUserWithEmailAndPassword(
        email: email, password: password)) as User;

      _userFromFirebaseUser(user);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'weak-password') {
        ;
      } else if (e.code == 'email-already-in-use') {
        print('The account already exists for that email.');
      }
    } catch (e) {
      print(e);
    }
  }

  Future signin(email, password) async {
    try {
      User user = (await auth.signInWithEmailAndPassword(
        email: email,password: password)) as User;

      _userFromFirebaseUser(user);
    } on FirebaseAuthException catch (e) {
      print(e);
    } catch (e) {
      print(e);
    }
  }
  Future signout() async {
    try {
      return await auth.signOut();
    } catch (e) {
      print(e.toString());
      return null;
    }
  }
}