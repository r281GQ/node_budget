// const { mongoose } = require("./../../src/db/mongooseConfig");
//
// before(done => {
//   mongoose.connect("mongodb://localhost:27017/test");
//   mongoose.connection
//     .once("open", () => {
//       done();
//     })
//     .on("error", error => {
//       console.warn("Warning", error);
//     });
// });
//
//
//
//
//
//
// beforeEach((done) => {
//   const { users, accounts, transactions, equities, budgets, groupings } = mongoose.connection.collections;
//   users.drop(() => {
//     accounts.drop(() => {
//       budgets.drop(() => {
//         equities.drop(() => {
//           groupings.drop(()=>{
//             transactions.drop(()=>done());
//           });
//         });
//       });
//     });
//   });
//   });
