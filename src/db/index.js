import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"


// Use async because :-> Non-Blocking Behavior: Node.js is single-threaded.
//  If you tried to connect to a database synchronously (blocking the thread), your entire server would freeze until the connection is established.
//  No other user could load a page during that time.

// use of await
// When you ask the database for data, it doesn't give you the data immediately. It gives you a Promise (essentially an I.O.U. note that says "I will get you this data soon").
// Without await: Your variable holds the "I.O.U. note" (the Promise), not the actual data.
// With await: JavaScript pauses, waits for the "I.O.U." to be fulfilled, takes the actual data out, and then moves to the next line.


// User A triggers the database call. The function pauses at await.

// User B can still visit your website. The server is free to handle User B's request while User A's data is being fetched.

// Once User A's data arrives, the function "unpauses" and finishe
const connectDB=async()=>{
    try{
      const connectionInstance=  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      console.log(`\n mongodb connected DB HOST ${connectionInstance.connection.host}`) 
    }
    catch(error){
        console.log(error)
        process.exit(1) // provided by node js . Used to stop server
    }
}

//why try catch
// Preventing Crashes: If a database connection fails (e.g., wrong password, database server is down) and you don't handle the error, your entire Node.js application will crash and exit. try/catch prevents the crash.

// Debugging: The catch block captures the specific error object. This allows you to log exactly what went wrong (e.g., MongoNetworkError vs AuthenticationFailed) so you can fix it.

// Graceful Exit: If the DB is vital, you might want to shut down the app safely (process.exit(1)) rather than letting it run in a broken state.
export default connectDB