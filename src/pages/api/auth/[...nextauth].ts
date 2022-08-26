import { query as q } from 'faunadb';

import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { fauna } from "../../../services/fauna";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET_KEY,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const { email } = user;
      try {
        q.If(
          q.Not(
            q.Exists(
              q.Match(
                q.Index('users_by_email'),
                q.Casefold(user.email)
              )
            )
          ),
          await fauna.query(
            q.Create(
              q.Collection('users'),
              { data: { email } }
            )
          ),  
          q.Get(
            q.Match(
              q.Index('users_by_email'),
              q.Casefold(user.email)
            )
          )
        )        
        return true;

      } catch(e) {
        console.log(e)
        return false;
      }
    }
  },
  secret: process.env.SECRET,
});