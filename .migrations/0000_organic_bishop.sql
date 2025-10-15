CREATE TABLE "movies" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"synopsis" varchar(2000) NOT NULL,
	"cover_key" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
