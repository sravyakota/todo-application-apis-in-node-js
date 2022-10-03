const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const databaseObjects = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    category: dbObj.category,
    priority: dbObj.priority,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoObjQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoObjQuery = `
            SELECT * FROM todo WHERE status = '${status}' AND  priority = '${priority}';`;
          data = await database.all(getTodoObjQuery);
          response.send(data.map((eachItem) => databaseObjects(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoObjQuery = `
                    SELECT * FROM todo WHERE status = '${status}' AND  category = '${category}';`;
          data = await database.all(getTodoObjQuery);
          response.send(data.map((eachItem) => databaseObjects(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoObjQuery = `
                    SELECT * FROM todo WHERE priority = '${priority}' AND  category = '${category}';`;
          data = await database.all(getTodoObjQuery);
          response.send(data.map((eachItem) => databaseObjects(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send(" Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoObjQuery = `
                    SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await database.all(getTodoObjQuery);
        response.send(data.map((eachItem) => databaseObjects(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoObjQuery = `
                    SELECT * FROM todo WHERE status = '${status}';`;
        data = await database.all(getTodoObjQuery);
        response.send(data.map((eachItem) => databaseObjects(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoObjQuery = `
            SELECT * FROM todo WHERE category = '${category}';`;
        data = await database.all(getTodoObjQuery);
        response.send(data.map((eachItem) => databaseObjects(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasSearchProperty(request.query):
      getTodoObjQuery = `SELECT * FROM todo WHERE todo like '%Buy%';`;
      data = await database.all(getTodoObjQuery);
      response.send(data.map((eachItem) => databaseObjects(eachItem)));
      break;

    default:
      getTodoObjQuery = `
            SELECT * FROM todo;`;
      data = await database.all(getTodoObjQuery);
      response.send(data.map((eachItem) => databaseObjects(eachItem)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT * FROM todo WHERE id = '${todoId}';`;
  const getTodoId = await database.get(getTodoIdQuery);
  response.send(databaseObjects(getTodoId));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getDateQuery = `
    SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const getDate = await database.all(getDateQuery);
    console.log(getDate);
    response.send(getDate.map((eachItem) => databaseObjects(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
        INSERT INTO 
         todo(id, todo, priority, status, category, due_date)
        VALUES 
         ('${id}','${todo}','${priority}', '${status}', '${category}','${postNewDate}');`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

/*app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  const perviousQuery = `SELECT * FROM todo WHERE todoId = '${todoId}';`;
  const previousTodo = await database.get(perviousQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updatedQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updatedQuery = `
            UPDATE  todo 
            SET todo = '${todo}', priority = '${priority}', status = '${status}' , category = '${category}',due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
        await database.run(updatedQuery);
        response.send("Status Updated");
      } else {
        response.status(401);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updatedQuery = `
            UPDATED todo 
            SET todo = '${todo}', priority = '${priority}', status = '${status}' , category = '${category}',due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
        await database.run(updatedQuery);
        response.send("Priority Updated");
      } else {
        response.status(401);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updatedQuery = `
            UPDATED todo 
            SET todo = '${todo}', priority = '${priority}', status = '${status}' , category = '${category}',due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
        await database.run(updatedQuery);
        response.send("Category Updated");
      } else {
        response.status(401);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.todo !== undefined:
      updatedQuery = `
            UPDATED todo 
            SET todo = '${todo}', priority = '${priority}', status = '${status}' , category = '${category}',due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
      await database.run(updatedQuery);
      response.send("Todo Updated");

    case requestBody.dueDate !== undefined:
      if (isMatch(date, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updatedQuery = `
            UPDATED todo 
            SET todo = '${todo}', priority = '${priority}', status = '${status}' , category = '${category}',due_date = '${dueDate}'
            WHERE id = '${todoId}';`;
        await database.run(updatedQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});*/

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

      await database.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id = '${todoId}';`;

  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
