The frontend is already configured for Vite, and I’m checking the package scripts so I can give you the exact command to run it.

Read [](file:///home/princewillopah/DevOps/%F0%9F%9B%A1%EF%B8%8Fmystuff/Apps-to-move/Shopsphere/NodeJS/frontend/package.json)

Run the frontend from the frontend folder with:

```bash
cd /home/princewillopah/DevOps/🛡️mystuff/Apps-to-move/Shopsphere/NodeJS/frontend
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

Important note:
- Your frontend is pointing to the backend at .env, where the API URL is set to:
  - `VITE_API_URL=http://localhost:5000/api`

So the backend must also be running on port 5000 for the frontend to work.


```


Test users 
John Doe — johndoe@gmail.com — password: 12345
Jane Doe — janedoe@gmail.com — password: 12345
Jack Doe — jackedoe@gmail.com — password: 12345


Test Admin:
Admin — admin@shopsphere.local — password: 123456
```