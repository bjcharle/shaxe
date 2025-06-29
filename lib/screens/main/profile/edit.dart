import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:shaxe/services/user.dart';

class Edit extends StatefulWidget {
  Edit({Key? key}) : super(key: key);

  @override
  _EditState createState() => _EditState();
}

class _EditState extends State<Edit> {
  UserService _userService = UserService();
  File? _profileImage;
  File? _bannerImage;
  final picker = ImagePicker();
  String name = '';
  String userId = '';
  String userName = '';
  String bio = '';
  String location = '';

  Future getImage(int type) async {
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    setState(() {
      if (pickedFile != null && type == 0) {
        _profileImage = File(pickedFile.path);
      }
      if (pickedFile != null && type == 1) {
        _bannerImage = File(pickedFile.path);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          TextButton(
              onPressed: () async {
                if (_profileImage != null && _bannerImage != null) {
                  await _userService.updateProfile(
                    userName,
                    _profileImage!,
                    bio,
                  );
                  Navigator.pop(context);
                } else {
                  // Show error or handle null images as needed
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Please select both profile and banner images.')),
                  );
                }
                Navigator.pop(context);
              },
              child: Text('Save'))
        ],
      ),
      body: Container(
        padding: EdgeInsets.symmetric(vertical: 20, horizontal: 50),
        child: new Form(
            child: Column(
          children: [
            TextButton(
              onPressed: () => getImage(0),
              child: _profileImage == null
                  ? Icon(Icons.person)
                  : Image.file(
                      _profileImage!,
                      height: 100,
                    ),
            ),
            TextButton(
              onPressed: () => getImage(1),
              child: _bannerImage == null
                  ? Icon(Icons.person)
                  : Image.file(
                      _bannerImage!,
                      height: 100,
                    ),
            ),
            TextFormField(
              onChanged: (val) => setState(() {
                name = val;
              }),
            )
          ],
        )),
      ),
    );
  }
}