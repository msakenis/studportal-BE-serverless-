const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = function (context, req) {
  try {
    const token = req.headers.authorization.split(' ')[1]; // check if logged in
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);

    if (req.method === 'POST') {
      // does this if recieves POST req

      let selectedStudents = req.body.slice(1, 2)[0]; // body contains both selected students and courseInfo, so needs to separate it.
      let courseInfo = req.body.slice(0, 1)[0];

      if (validateAddCourse(courseInfo, selectedStudents)) {
        const selectStudsIds = selectedStudents.map((student) => student.id);
        database((db) => {
          // validation that the same student should not be added to another course
          db.query(
            `SELECT * FROM STUDENTS WHERE id IN (${mysql.escape(
              selectStudsIds
            )})`,
            (err, result) => {
              if (err) {
                sendContext(context, err, 400);
              } else {
                if (result.some((student) => student.course_id !== 0)) {
                  sendContext(
                    context,
                    { msg: 'Some of the students already in the course!' },
                    400
                  );
                } else {
                  db.query(
                    // inserts course info
                    `INSERT INTO courses (title, lecturer, description, student_count, reg_date) VALUES (${mysql.escape(
                      courseInfo.title
                    )}, ${mysql.escape(courseInfo.lecturer)}, ${mysql.escape(
                      courseInfo.description
                    )}, ${mysql.escape(selectedStudents.length)}, now())`,
                    (err, result) => {
                      if (err) {
                        sendContext(context, err, 400);
                      } else {
                        let values = selectedStudents.map((element) => {
                          return element.id;
                        });
                        db.query(
                          `UPDATE students SET course_id = ${
                            // updates students table adding course id to every students who is in the course
                            result.insertId
                          } WHERE id IN (${mysql.escape(values)})`,
                          (err, result) => {
                            if (err) {
                              sendContext(context, err, 400);
                            } else {
                              sendContext(
                                context,
                                { msg: 'Course successfully created!' },
                                201
                              );
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            }
          );
        });
      }
    } else {
      // does this if recieves GET req
      // this return all unselected students. The one student can be only in one course at the moment
      database((db) =>
        db.query(
          `SELECT * FROM students WHERE course_id = '0'`,
          (err, result) => {
            if (err) {
              sendContext(context, err, 400);
            } else {
              sendContext(context, result, 200);
            }
          }
        )
      );
    }
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }

  function validateAddCourse(courseInfo, selectedStudents) {
    if (
      courseInfo.title.length < 50 &&
      courseInfo.title.length > 2 &&
      courseInfo.lecturer.length < 50 &&
      courseInfo.lecturer.length > 2 &&
      courseInfo.description.length < 50 &&
      courseInfo.description.length > 2
    ) {
      if (selectedStudents.length !== 0) {
        return true;
      } else {
        sendContext(context, { msg: 'No students selected!' }, 400);
      }
    } else {
      sendContext(context, { msg: 'Error in filling the form!' }, 400);
      return false;
    }
  }
};
