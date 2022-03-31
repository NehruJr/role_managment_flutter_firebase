const functions = require("firebase-functions");

var admin = require("firebase-admin");

const { auth } = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

class UnauthenticatedError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.type = "UnauthenticatedError";
  }
}

class NotAnAdminError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.type = "NotAnAdminError";
  }
}

class InvalidRoleError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.type = "InvalidRoleError";
  }
}

function roleIsValid(role) {
  const validRoles = ["admin", "call center", "pharmacy chain"];
  return validRoles.includes(role);
}

exports.createRole = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new UnauthenticatedError(
        "The user is not authenticated. Only authenticated Admin users can create new users."
      );
    }

    const callerUid = context.auth.uid;
    const callerUserRecord = await admin.auth().getUser(callerUid);
    if (!callerUserRecord.customClaims.admin) {
      throw new NotAnAdminError("Only Admin users can create new users.");
    }

    const role = data.role;
    if (!roleIsValid(role)) {
      throw new InvalidRoleError('The "' + role + '" role is not a valid role');
    }

    const newUser = {
      email: data.email,
      emailVerified: false,
      password: data.password,
      displayName: data.name,
      disabled: false,
    };

    const userRecord = await admin.auth().createUser(newUser);

    const userId = userRecord.uid;

    const claims = {};
    claims[role] = true;

    await admin.auth().setCustomUserClaims(userId, claims);

    const docRef = db.collection("admins").doc(userId)
    const document = await docRef.set(data)

    return { result: "The new user has been successfully created." };
  } catch (error) {
    if (error.type === "UnauthenticatedError") {
      throw new functions.https.HttpsError("unauthenticated", error.message);
    } else if (
      error.type === "NotAnAdminError" ||
      error.type === "InvalidRoleError"
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        error.message
      );
    } else {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
});
