import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

export class DirService {
  #watcher = null;
  #pathToWatch = "/";
  #eventEmiter = null;
  #eventsTypes = {
    FILE_CREATED: "file_created",
    FILE_DELETED: "file_deleted",
    ERROR: "error",
  };

  constructor(pathToWatch) {
    this.#eventEmiter = new EventEmitter();
    this.#pathToWatch = path.resolve(pathToWatch);
  }

  start() {
    try {
      
      if (!fs.existsSync(this.#pathToWatch)) {
        this.#eventEmiter.emit(this.#eventsTypes.ERROR, `Path ${this.#pathToWatch} doesn't exists`);
        return;
      }
      const initFiles = fs.readdirSync(this.#pathToWatch);

      this.#watcher = fs.watch(this.#pathToWatch, (eventType, file) => {
        const watchedFiles = fs.readdirSync(this.#pathToWatch);

        if (initFiles.length === watchedFiles.length) {
          return;
        }
        if (
          !initFiles.includes(file) &&
          initFiles.length <= watchedFiles.length
        ) {
            initFiles.push(file);
            this.#eventEmiter.emit(this.#eventsTypes.FILE_CREATED, {
              filename: file,
          });
          return;
        }
        if (initFiles.length > watchedFiles.length) {
          initFiles = initFiles.filter((f) => f != file);
          this.#eventEmiter.emit(this.#eventsTypes.FILE_DELETED, {
            filename: file,
          });
          return;
        }
      });
    } catch (e) {
      this.#eventEmiter.emit(this.#eventsTypes.ERROR, e);
    }
  }

  on(eventType, cb) {
    if (!cb && typeof cb !== "function") {
      this.#eventEmiter.emit(this.#eventsTypes.ERROR, `${cb} not callable or function`)
    }
    const { FILE_CREATED, FILE_DELETED, ERROR } = this.#eventsTypes;

    switch (eventType) {
      case FILE_CREATED:
        this.#eventEmiter.on(this.#eventsTypes.FILE_CREATED, cb);
        return;
      case FILE_DELETED:
        this.#eventEmiter.on(this.#eventsTypes.FILE_DELETED, cb);
        return;
      case ERROR:
        this.#eventEmiter.on(this.#eventsTypes.ERROR, cb);
        return;
      default:
        throw new Error("Not supported event");
    }
  }
  stop(){
    try{
      this.#watcher.close();
      console.log('Watcher closed')
    }catch(e){
      this.#eventEmiter.emit(this.#eventsTypes.ERROR, e);
    }finally{
      this.#eventEmiter.removeAllListeners();
    }


  }
}
