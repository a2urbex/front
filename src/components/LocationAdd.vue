<script setup>
import { ref, onMounted } from 'vue';
import { useLocationStore } from '@/stores/location';
import { toast } from 'vue3-toastify';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object,
    default: () => ({})
  }
});

const locationStore = useLocationStore();

const name = ref('');
const categoryId = ref('');
const image = ref(null);
const lat = ref('');
const lon = ref('');
const imagePreview = ref(null); 

const locationTypes = [
  { id: 1, name: 'castle' },
  { id: 2, name: 'hostel' },
  { id: 3, name: 'cinema' },
  { id: 4, name: 'train' },
  { id: 5, name: 'hospital' },
  { id: 6, name: 'house' },
  { id: 7, name: 'factory' },
  { id: 8, name: 'building' },
  { id: 9, name: 'restaurant' },
  { id: 10, name: 'military' }
];

const currentStep = ref(1);
const totalSteps = 5;

const emit = defineEmits(['close']);

onMounted(() => {
  if (props.isEdit && props.editData) {
    name.value = props.editData.name || '';
    categoryId.value = props.editData.categoryId || '';
    lat.value = String(props.editData.lat || '');
    lon.value = String(props.editData.lon || '');
    if (props.editData.image) {
      imagePreview.value = props.editData.image;
    }
  }
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  image.value = file;
  if (file) {
    imagePreview.value = URL.createObjectURL(file);
  }
};

const nextStep = () => {
  let canProceed = true;
  
  switch (currentStep.value) {
    case 1:
      canProceed = name.value.trim() !== '';
      if (!canProceed) toast.error('Name is required', {
        position: "top-center",
        autoClose: 1000,
        pauseOnHover: true,
        theme: "dark"
      });
      break;
    case 2:
      canProceed = categoryId.value !== '';
      if (!canProceed) toast.error('Category is required', {
        position: "top-center",
        autoClose: 1000,
        pauseOnHover: true,
        theme: "dark"
      });
      break;
    case 3:
      // Image is optional, always allow proceeding
      canProceed = true;
      break;
    case 4:
      canProceed = String(lat.value).trim() !== '';
      if (!canProceed) toast.error('Latitude is required', {
        position: "top-center",
        autoClose: 1000,
        pauseOnHover: true,
        theme: "dark"
      });
      break;
  }

  if (canProceed && currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const submitForm = async () => {
  // If not on the last step, treat Enter as "Next"
  if (currentStep.value < totalSteps) {
    nextStep();
    return;
  }

  const formData = new FormData();
  formData.append('name', name.value);
  formData.append('categoryId', categoryId.value);
  if (image.value) {
    formData.append('image', image.value);
  }
  formData.append('lat', lat.value);
  formData.append('lon', lon.value);

  try {
    if (props.isEdit) {
      await locationStore.updateLocation(props.editData.id, formData);
    } else {
      await locationStore.addLocation(formData);
    }
    emit('close');
  } catch (error) {
    toast.error('An error occurred', {
      position: "top-center",
      autoClose: 2000,
      pauseOnHover: true,
      theme: "dark"
    });
  }
};

const handleClose = () => {
  emit('close');
};

</script>

<template>
    <transition name="slide-up" mode="out-in" appear>
    <div class="location-add">
      <button type="button" class="location-add__close" @click="handleClose">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

        <div class="location-add__title center">
        <h2>{{ isEdit ? 'Edit' : 'Add' }} location</h2>
        <p>Step {{ currentStep }} of {{ totalSteps }}</p>
        </div>
        <div class="location-add__content">
        <form @submit.prevent="submitForm" class="form">
            <!-- Step 1: Name -->
            <div v-if="currentStep === 1" class="st-form-group">
            <input placeholder=" " type="text" id="name" v-model="name" required />
            <label for="name">Name:</label>
            <div class="input-line"></div>
            </div>

            <!-- Step 2: Category -->
            <div v-if="currentStep === 2" class="st-form-group">
            <select id="categoryId" v-model="categoryId" required>
                <option value="" disabled>Select a category</option>
                <option v-for="type in locationTypes" :key="type.id" :value="type.id">
                    {{ type.name.charAt(0).toUpperCase() + type.name.slice(1) }}
                </option>
            </select>
            <label for="categoryId">Category:</label>
            <div class="input-line"></div>
            </div>

            <!-- Step 3: Image -->
            <div v-if="currentStep === 3" class="st-form-group">
            <input placeholder=" " type="file" id="image" @change="handleFileChange" accept="image/*" />
            <label for="image">Image:</label>
            <div class="input-line"></div>
            </div>
            <!-- Image preview section -->
            <div v-if="imagePreview && currentStep === 3" class="form-group">
            <img :src="imagePreview" alt="Image Preview" class="image-preview" />
            </div>

            <!-- Step 4: Latitude -->
            <div v-if="currentStep === 4" class="st-form-group">
            <input placeholder=" " type="text" id="lat" v-model="lat" required />
            <label for="lat">Latitude:</label>
            <div class="input-line"></div>
            </div>

            <!-- Step 5: Longitude -->
            <div v-if="currentStep === 5" class="st-form-group">
            <input placeholder=" " type="text" id="lon" v-model="lon" required />
            <label for="lon">Longitude:</label>
            <div class="input-line"></div>
            </div>

            <!-- Navigation buttons -->
            <div class="form-navigation">
            <button type="button" class="st-btn st-btn-outline" @click="prevStep" v-if="currentStep > 1">Previous</button>
            <button type="button" class="st-btn" @click="nextStep" v-if="currentStep < totalSteps">
                <span>Next</span>
                <div class="btn-glow"></div>
            </button>
            <button type="submit" class="st-btn" v-if="currentStep === totalSteps">
                <span>Submit</span>
                <div class="btn-glow"></div>
            </button>
            </div>
        </form>
        </div>
    </div>                        

    </transition>
</template>

<style lang="scss">
@use '../assets/styles/components/locationAdd.scss' as *;
</style>
