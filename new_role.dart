  Future<void> addNewRole(
      {required String name,
      required String password,
      required String email,
      required String role}) async {
    try {
      HttpsCallable addAdminRole =
          FirebaseFunctions.instance.httpsCallable('createRole');
      var user = {
        'name': name,
        'password': password,
        'email': email,
        'role': role,
      };
      addAdminRole(user).then((res) {
        print(res.data.toString());
      }).catchError((err) {
        print(err.message);
      });
    } catch (error) {
      print(error.toString());
    }
  }
