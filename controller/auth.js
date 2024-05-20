const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const nodemailer = require('../libs/nodemailer')

module.exports = {
    register: async (req, res, next) => {
        try {
            let { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({
                    status: false,
                    message: `all data are required`,
                    data: null,
                });
            }

            let exist = await prisma.user.findFirst({ where: { email } })
            if (exist) {
                return res.status(400).json({
                    status: false,
                    message: 'email already used',
                    data: null
                })
            }

            let encryptedPassword = await bcrypt.hash(password, 10)
            let user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: encryptedPassword,
                },
            })
            delete user.password

            return res.status(201).json({
                status: true,
                message: 'success',
                data: { user }
            })

        } catch (err) {
            next(err)
        }
    },

    login: async (req, res, next) => {
        try {
            let { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    status: false,
                    message: 'invalid email or password',
                    data: null
                });
            }

            let user = await prisma.user.findFirst({ where: { email } });
            console.log(user);
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'invalid email or password!',
                    data: null
                });
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    status: false,
                    message: 'invalid email or password!',
                    data: null
                });
            }

            delete user.password;
            let token = jwt.sign(user, JWT_SECRET);

            res.json({
                status: true,
                message: 'OK',
                data: { ...user, token }
            });
        } catch (error) {
            next(error);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            const user = await prisma.user.findFirst({ where: { email } });

            if (!user) {
                return res.status(404).json({
                  status: false,
                  message: "Failed",
                  data: null,
                });
              }

            const token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);

            const html = await nodemailer.getHTML("link-reset.ejs", {
                name: user.name,
                url: `${req.protocol}://${req.get('host')}/resetpassword/${token}`,
            });
            await nodemailer.sendMail(user.email, "Email for forgot Password", html);

        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            let hashPassword = await bcrypt.hash(password, 10);

            jwt.verify(token, JWT_SECRET_KEY, async (err, data) => {
                if (err) {
                    return res.status(403).json({
                      status: false,
                      message: "Failed",
                      data: null,
                    });
                  }

                const update = await prisma.user.update({
                    where: { email: data.email },
                    data: { password: hashPassword },
                });

                const notification = await prisma.notification.create({
                    data: {
                        title: "Update Succesfully",
                        message:
                            "Update Password Successfully",
                        createdDate: new Date().toISOString(),
                        user: { connect: { id: update.id } },
                    },
                });

                req.io.emit(`user-${updateUser.id}`, notification);

                res.status(200).json({
                  status: true,
                  message: "Update Password Successfully",
                  data: updateUser,
            });
            },
        } catch (error) {
            next(error);
        }
    },

    notification: async (req, res, next) => {
        try {
          const { id } = Number(req.params);
          const notifications = await prisma.notification.findMany({
            where: { user_id: id },
          });
          res.render('notification', { notifications, user_id });
        } catch (error) {
          Sentry.captureException(error);
          next(error);
        }
      },
}
