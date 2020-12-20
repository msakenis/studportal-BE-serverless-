const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = function (context, req) {
  const id = context.bindingData.id; // takes id from route params

  try {
    // checks if logged in
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);

    if (req.method === 'POST') {
      let selectedStudents = req.body.slice(1, 2)[0]; //body contains selected students and course info, that we need to separate and use
      let courseInfo = req.body.slice(0, 1)[0];

      if (validateEditCourse(courseInfo, selectedStudents)) {
        database((db) => {
          db.query(
            `UPDATE courses SET title = ${mysql.escape(
              courseInfo.title
            )}, lecturer = ${mysql.escape(
              courseInfo.lecturer
            )}, description = ${mysql.escape(
              courseInfo.description
            )}, student_count = ${mysql.escape(
              selectedStudents.length
            )} WHERE id = ${mysql.escape(id)}`,
            (err, result) => {
              if (err) {
                sendContext(context, err, 400);
              } else {
                let values = selectedStudents.map((element) => {
                  return element.id;
                });
                db.query(
                  // changes students course id which they belong to
                  `UPDATE students SET course_id = ${mysql.escape(
                    id
                  )} WHERE id IN (${mysql.escape(values)})`,
                  (err, result) => {
                    if (err) {
                      sendContext(context, err, 400);
                    } else {
                      db.query(
                        // unsets all students which were removed from course course id to 0
                        `UPDATE students SET course_id = '0' WHERE id NOT IN (${mysql.escape(
                          values
                        )}) AND course_id = ${mysql.escape(id)}`,
                        (err, result) => {
                          if (err) {
                            sendContext(context, err, 400);
                          } else {
                            sendContext(
                              context,
                              { msg: 'Course successfully updated!' },
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
          );
        });
      }
    } else {
      database((db) =>
        db.query(
          `SELECT * FROM courses WHERE id = ${mysql.escape(id)}`, // gets course info
          (err, courseResult) => {
            if (err) {
              sendContext(context, err, 400);
            } else {
              if (courseResult.length !== 0) {
                db.query(
                  `SELECT * FROM students WHERE course_id = ${mysql.escape(
                    // gets all students who is in the course
                    id
                  )}`,
                  (err, studentsResult) => {
                    if (err) {
                      sendContext(context, err, 400);
                    } else {
                      db.query(
                        `SELECT * FROM students WHERE course_id = '0'`, // gets all students who is NOT in the course that could be added to course
                        (err, unselectedResult) => {
                          if (err) {
                            sendContext(context, err, 400);
                          } else {
                            sendContext(
                              context, // assigns all results to send as one object
                              Object.assign(
                                courseResult[0],
                                {
                                  selectedStuds: studentsResult,
                                },
                                { unselectedStuds: unselectedResult }
                              ),
                              200
                            );
                          }
                        }
                      );
                    }
                  }
                );
              } else {
                sendContext(context, { msg: 'Course Not Found!' }, 400);
              }
            }
          }
        )
      );
    }
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }
  function validateEditCourse(courseInfo, selectedStudents) {
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
