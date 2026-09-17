-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problemsInPlaylist" (
    "id" TEXT NOT NULL,
    "playlistID" TEXT NOT NULL,
    "problemID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problemsInPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_title_userID_key" ON "playlist"("title", "userID");

-- CreateIndex
CREATE UNIQUE INDEX "problemsInPlaylist_playlistID_problemID_key" ON "problemsInPlaylist"("playlistID", "problemID");

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemsInPlaylist" ADD CONSTRAINT "problemsInPlaylist_playlistID_fkey" FOREIGN KEY ("playlistID") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemsInPlaylist" ADD CONSTRAINT "problemsInPlaylist_problemID_fkey" FOREIGN KEY ("problemID") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
