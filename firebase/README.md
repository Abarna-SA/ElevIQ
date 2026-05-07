# Firebase Configuration

This folder contains shared Firebase configuration for ELEVIQ.

## Structure

```
firebase/
├── .firebaserc          # Project configuration
├── firebase.json        # Firebase services config
├── rules/
│   ├── firestore.rules  # Firestore security rules
│   ├── storage.rules    # Storage security rules
│   └── firestore.indexes.json  # Indexes
└── functions/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts     # Main functions
        └── email.ts     # Email service
```

## Deploy Commands

```bash
# Deploy everything
cd firebase && firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules,storage

# Deploy only functions
firebase deploy --only functions

# Deploy only indexes
firebase deploy --only firestore:indexes
```

## Setup Functions

```bash
cd firebase/functions
npm install
npm run build
```

## Emulators

```bash
cd firebase
firebase emulators:start
```

UI available at http://localhost:4000
